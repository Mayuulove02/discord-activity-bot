const UserActivity = require('../models/UserActivity');

/**
 * Get or create a user activity record
 * @param {String} userId - Discord user ID
 * @param {String} username - Discord username
 * @param {String} guildId - Discord guild/server ID
 * @param {String} guildName - Discord guild/server name
 * @returns {Promise<Object>} - User activity document
 */
const getOrCreateUserActivity = async (userId, username, guildId, guildName) => {
  try {
    let userActivity = await UserActivity.findOne({ userId, guildId });
    
    if (!userActivity) {
      userActivity = new UserActivity({
        userId,
        username,
        guildId,
        guildName,
        sessions: [],
        totalTimeInVoice: 0
      });
      await userActivity.save();
    }
    
    return userActivity;
  } catch (error) {
    console.error('Error in getOrCreateUserActivity:', error);
    throw error;
  }
};

/**
 * Start tracking a user's voice session
 * @param {String} userId - Discord user ID
 * @param {String} username - Discord username
 * @param {String} guildId - Discord guild/server ID
 * @param {String} guildName - Discord guild/server name
 * @param {String} channelId - Voice channel ID
 * @param {String} channelName - Voice channel name
 * @param {Boolean} micEnabled - Is microphone enabled
 * @param {Boolean} deafened - Is user deafened
 * @param {Boolean} streaming - Is user streaming
 * @returns {Promise<Object>} - Updated user activity
 */
const startUserSession = async (userId, username, guildId, guildName, channelId, channelName, micEnabled, deafened, streaming) => {
  try {
    const userActivity = await getOrCreateUserActivity(userId, username, guildId, guildName);
    
    // End any existing sessions first
    userActivity.endSession();
    
    // Start a new session
    userActivity.startSession(channelId, channelName, micEnabled, deafened, streaming);
    await userActivity.save();
    
    return userActivity;
  } catch (error) {
    console.error('Error in startUserSession:', error);
    throw error;
  }
};

/**
 * End a user's voice session
 * @param {String} userId - Discord user ID
 * @param {String} guildId - Discord guild/server ID
 * @returns {Promise<Object>} - Updated user activity
 */
const endUserSession = async (userId, guildId) => {
  try {
    const userActivity = await UserActivity.findOne({ userId, guildId });
    
    if (userActivity) {
      userActivity.endSession();
      await userActivity.save();
      return userActivity;
    }
    
    return null;
  } catch (error) {
    console.error('Error in endUserSession:', error);
    throw error;
  }
};

/**
 * Update a user's current session status
 * @param {String} userId - Discord user ID
 * @param {String} guildId - Discord guild/server ID
 * @param {Boolean} micEnabled - Is microphone enabled
 * @param {Boolean} deafened - Is user deafened
 * @param {Boolean} streaming - Is user streaming
 * @returns {Promise<Object>} - Updated user activity
 */
const updateUserSessionStatus = async (userId, guildId, micEnabled, deafened, streaming) => {
  try {
    const userActivity = await UserActivity.findOne({ userId, guildId });
    
    if (userActivity) {
      userActivity.updateSessionStatus(micEnabled, deafened, streaming);
      await userActivity.save();
      return userActivity;
    }
    
    return null;
  } catch (error) {
    console.error('Error in updateUserSessionStatus:', error);
    throw error;
  }
};

/**
 * Get activity statistics for a user
 * @param {String} userId - Discord user ID
 * @param {String} guildId - Discord guild/server ID
 * @returns {Promise<Object>} - Activity statistics
 */
const getUserActivityStats = async (userId, guildId) => {
  try {
    const userActivity = await UserActivity.findOne({ userId, guildId });
    
    if (!userActivity) {
      return {
        totalTimeInVoice: 0,
        sessionsCount: 0,
        isPremium: false
      };
    }
    
    // Ensure total time is up to date
    userActivity.calculateTotalTime();
    await userActivity.save();
    
    return {
      totalTimeInVoice: userActivity.totalTimeInVoice,
      sessionsCount: userActivity.sessions.length,
      isPremium: userActivity.isPremium,
      lastUpdated: userActivity.lastUpdated
    };
  } catch (error) {
    console.error('Error in getUserActivityStats:', error);
    throw error;
  }
};

/**
 * Get server activity leaderboard
 * @param {String} guildId - Discord guild/server ID
 * @param {Number} limit - Number of users to include in leaderboard
 * @returns {Promise<Array>} - Leaderboard data
 */
const getServerLeaderboard = async (guildId, limit = 10) => {
  try {
    const users = await UserActivity.find({ guildId })
      .sort({ totalTimeInVoice: -1 })
      .limit(limit);
    
    return users.map(user => ({
      userId: user.userId,
      username: user.username,
      totalTimeInVoice: user.totalTimeInVoice,
      isPremium: user.isPremium
    }));
  } catch (error) {
    console.error('Error in getServerLeaderboard:', error);
    throw error;
  }
};

/**
 * Set user premium status
 * @param {String} userId - Discord user ID
 * @param {Boolean} isPremium - Premium status
 * @returns {Promise<Boolean>} - Success status
 */
const setUserPremiumStatus = async (userId, isPremium) => {
  try {
    const result = await UserActivity.updateMany(
      { userId },
      { $set: { isPremium } }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error in setUserPremiumStatus:', error);
    throw error;
  }
};

module.exports = {
  getOrCreateUserActivity,
  startUserSession,
  endUserSession,
  updateUserSessionStatus,
  getUserActivityStats,
  getServerLeaderboard,
  setUserPremiumStatus
};
