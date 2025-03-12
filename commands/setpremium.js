const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setUserPremiumStatus } = require('../utils/activityUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpremium')
    .setDescription('Set a user\'s premium status (Admin only)')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to update premium status for')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('premium')
        .setDescription('Premium status (true/false)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ 
        content: 'You do not have permission to use this command.', 
        ephemeral: true 
      });
    }
    
    await interaction.deferReply();
    
    try {
      const targetUser = interaction.options.getUser('user');
      const premiumStatus = interaction.options.getBoolean('premium');
      
      const success = await setUserPremiumStatus(targetUser.id, premiumStatus);
      
      if (success) {
        await interaction.editReply(`${targetUser.username || targetUser.globalName || targetUser.displayName}'s premium status has been set to: ${premiumStatus ? 'Premium ⭐' : 'Free'}`);
      } else {
        await interaction.editReply(`Failed to update ${targetUser.username || targetUser.globalName || targetUser.displayName}'s premium status.`);
      }
    } catch (error) {
      console.error('Error executing setpremium command:', error);
      await interaction.editReply('There was an error updating the premium status.');
    }
  },
};
