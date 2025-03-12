const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getServerLeaderboard } = require('../utils/activityUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server voice activity leaderboard')
    .addIntegerOption(option => 
      option.setName('limit')
        .setDescription('Number of users to show (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const limit = interaction.options.getInteger('limit') || 10;
      const leaderboard = await getServerLeaderboard(interaction.guild.id, limit);
      
      if (leaderboard.length === 0) {
        return interaction.editReply('No activity data available for this server yet.');
      }
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Voice Activity Leaderboard for ${interaction.guild.name}`)
        .setDescription('Users with the most voice channel activity:');
      
      leaderboard.forEach((user, index) => {
        embed.addFields({
          name: `${index + 1}. ${user.username} ${user.isPremium ? '⭐' : ''}`,
          value: `${user.totalTimeInVoice} minutes in voice channels`
        });
      });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing leaderboard command:', error);
      await interaction.editReply('There was an error fetching the leaderboard.');
    }
  },
};
