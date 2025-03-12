const { Client, GatewayIntentBits, Partials, Events, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import activity utilities
const {
  startUserSession,
  endUserSession,
  updateUserSessionStatus,
  getUserActivityStats,
  getServerLeaderboard,
  setUserPremiumStatus
} = require('./utils/activityUtils');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// Collection for commands
client.commands = new Collection();

// Connect to MongoDB
connectDB();

// Load command files
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// When the client is ready, run this code
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Bot is tracking voice activity in ${client.guilds.cache.size} servers`);
  
  // Set bot activity
  client.user.setActivity('Voice Activity', { type: ActivityType.Watching });
});

// Handle voice state updates
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    // Skip bot users
    if (oldState.member.user.bot || newState.member.user.bot) return;
    
    const userId = newState.member.user.id;
    const username = newState.member.user.username || newState.member.user.globalName || newState.member.displayName;
    const guildId = newState.guild.id;
    const guildName = newState.guild.name;
    
    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      console.log(`User ${username} joined voice channel ${newState.channel.name}`);
      
      await startUserSession(
        userId,
        username,
        guildId,
        guildName,
        newState.channelId,
        newState.channel.name,
        !newState.selfMute,
        newState.selfDeaf,
        newState.streaming
      );
    }
    
    // User left a voice channel
    else if (oldState.channelId && !newState.channelId) {
      console.log(`User ${username} left voice channel ${oldState.channel.name}`);
      
      await endUserSession(userId, guildId);
    }
    
    // User moved between voice channels
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      console.log(`User ${username} moved from ${oldState.channel.name} to ${newState.channel.name}`);
      
      await endUserSession(userId, guildId);
      await startUserSession(
        userId,
        username,
        guildId,
        guildName,
        newState.channelId,
        newState.channel.name,
        !newState.selfMute,
        newState.selfDeaf,
        newState.streaming
      );
    }
    
    // User updated their voice state (mute, deafen, stream)
    else if (
      oldState.selfMute !== newState.selfMute ||
      oldState.selfDeaf !== newState.selfDeaf ||
      oldState.streaming !== newState.streaming
    ) {
      console.log(`User ${username} updated voice state in ${newState.channel.name}`);
      
      await updateUserSessionStatus(
        userId,
        guildId,
        !newState.selfMute,
        newState.selfDeaf,
        newState.streaming
      );
    }
  } catch (error) {
    console.error('Error handling voice state update:', error);
  }
});

// Handle interaction create (slash commands)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle message commands
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Check for prefix command
  if (message.content.startsWith('!activity')) {
    const args = message.content.slice('!activity'.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase() || 'help';
    
    if (command === 'stats') {
      try {
        // Get user ID (either mentioned user or command author)
        const targetUser = message.mentions.users.first() || message.author;
        const stats = await getUserActivityStats(targetUser.id, message.guild.id);
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Voice Activity Stats for ${targetUser.username || targetUser.globalName || targetUser.displayName}`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { name: 'Total Time in Voice', value: `${stats.totalTimeInVoice} minutes`, inline: true },
            { name: 'Sessions Count', value: `${stats.sessionsCount}`, inline: true },
            { name: 'Premium Status', value: stats.isPremium ? 'Premium' : 'Free', inline: true }
          )
          .setFooter({ text: `Last Updated: ${stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}` });
        
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Error getting user stats:', error);
        await message.reply('There was an error fetching the activity stats.');
      }
    } else if (command === 'leaderboard') {
      try {
        const leaderboard = await getServerLeaderboard(message.guild.id, 10);
        
        if (leaderboard.length === 0) {
          return message.reply('No activity data available for this server yet.');
        }
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Voice Activity Leaderboard for ${message.guild.name}`)
          .setDescription('Users with the most voice channel activity:');
        
        leaderboard.forEach((user, index) => {
          embed.addFields({
            name: `${index + 1}. ${user.username} ${user.isPremium ? '⭐' : ''}`,
            value: `${user.totalTimeInVoice} minutes in voice channels`
          });
        });
        
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Error getting leaderboard:', error);
        await message.reply('There was an error fetching the leaderboard.');
      }
    } else if (command === 'setpremium' && message.member.permissions.has('Administrator')) {
      try {
        const targetUser = message.mentions.users.first();
        const premiumStatus = args[1]?.toLowerCase() === 'true';
        
        if (!targetUser) {
          return message.reply('Please mention a user to update their premium status.');
        }
        
        const success = await setUserPremiumStatus(targetUser.id, premiumStatus);
        
        if (success) {
          await message.reply(`${targetUser.username || targetUser.globalName || targetUser.displayName}'s premium status has been set to: ${premiumStatus ? 'Premium' : 'Free'}`);
        } else {
          await message.reply(`Failed to update ${targetUser.username || targetUser.globalName || targetUser.displayName}'s premium status.`);
        }
      } catch (error) {
        console.error('Error setting premium status:', error);
        await message.reply('There was an error updating the premium status.');
      }
    } else if (command === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Voice Activity Tracker - Help')
        .setDescription('Available commands:')
        .addFields(
          { name: '!activity stats [@user]', value: 'View your or mentioned user\'s voice activity stats' },
          { name: '!activity leaderboard', value: 'View server voice activity leaderboard' },
          { name: '!activity help', value: 'Show this help message' },
          { name: '!activity setpremium @user true/false', value: 'Set user premium status (Admin only)' }
        );
      
      await message.reply({ embeds: [embed] });
    }
  }
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('Successfully logged in to Discord');
  })
  .catch(error => {
    console.error('Failed to log in to Discord:', error.message);
    console.error('Please check your Discord token in the .env file');
  });
