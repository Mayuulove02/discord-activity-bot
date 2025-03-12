const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  guildName: {
    type: String,
    required: true
  },
  sessions: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    micEnabled: {
      type: Boolean,
      default: true
    },
    deafened: {
      type: Boolean,
      default: false
    },
    streaming: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 0 // Duration in minutes
    }
  }],
  totalTimeInVoice: {
    type: Number,
    default: 0 // Total time in minutes
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isPremium: {
    type: Boolean,
    default: false
  }
});

// Method to calculate total activity time
userActivitySchema.methods.calculateTotalTime = function() {
  let total = 0;
  this.sessions.forEach(session => {
    if (session.duration) {
      total += session.duration;
    } else if (session.startTime && session.endTime) {
      const duration = Math.floor((session.endTime - session.startTime) / (1000 * 60)); // Convert to minutes
      total += duration;
      session.duration = duration;
    }
  });
  this.totalTimeInVoice = total;
  return total;
};

// Method to add a new session
userActivitySchema.methods.startSession = function(channelId, channelName, micEnabled, deafened, streaming) {
  this.sessions.push({
    startTime: new Date(),
    channelId,
    channelName,
    micEnabled,
    deafened,
    streaming
  });
  this.lastUpdated = new Date();
};

// Method to end the latest session
userActivitySchema.methods.endSession = function() {
  if (this.sessions.length > 0) {
    const latestSession = this.sessions[this.sessions.length - 1];
    if (!latestSession.endTime) {
      latestSession.endTime = new Date();
      const duration = Math.floor((latestSession.endTime - latestSession.startTime) / (1000 * 60)); // Convert to minutes
      latestSession.duration = duration;
      this.calculateTotalTime();
      this.lastUpdated = new Date();
    }
  }
};

// Method to update session status
userActivitySchema.methods.updateSessionStatus = function(micEnabled, deafened, streaming) {
  if (this.sessions.length > 0) {
    const latestSession = this.sessions[this.sessions.length - 1];
    if (!latestSession.endTime) {
      latestSession.micEnabled = micEnabled;
      latestSession.deafened = deafened;
      latestSession.streaming = streaming;
      this.lastUpdated = new Date();
    }
  }
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
