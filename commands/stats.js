const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserActivityStats } = require('../utils/activityUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View voice activity statistics')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check stats for')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get target user (either specified or command user)
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const stats = await getUserActivityStats(targetUser.id, interaction.guild.id);
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Voice Activity Stats for ${targetUser.username || targetUser.globalName || targetUser.displayName}`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'Total Time in Voice', value: `${stats.totalTimeInVoice} minutes`, inline: true },
          { name: 'Sessions Count', value: `${stats.sessionsCount}`, inline: true },
          { name: 'Premium Status', value: stats.isPremium ? 'Premium ⭐' : 'Free', inline: true }
        )
        .setFooter({ text: `Last Updated: ${stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'N/A'}` });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing stats command:', error);
      await interaction.editReply('There was an error fetching the activity stats.');
    }
  },
};
