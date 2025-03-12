# Discord Voice Activity Tracker Bot

A Discord bot that tracks user activity in voice channels, including microphone status, deafened status, and screen sharing. The bot stores this data in MongoDB and provides commands to view activity statistics and leaderboards.

## Features

- Tracks when users join, leave, or move between voice channels
- Monitors microphone status (muted/unmuted)
- Monitors deafened status
- Tracks screen sharing activity
- Stores all activity data in MongoDB
- Calculates total time spent in voice channels
- Provides activity statistics for users
- Shows server leaderboards for voice activity
- Supports premium user designation

## Setup Instructions

### Prerequisites

- Node.js (v16.9.0 or higher)
- MongoDB database (local or Atlas)
- Discord Bot Token

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your environment variables by editing the `.env` file:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string
   CLIENT_ID=your_discord_application_client_id
   ```

### Creating a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
5. Copy the bot token and add it to your `.env` file
6. Go to the "OAuth2" tab, then "URL Generator"
7. Select the following scopes: `bot`, `applications.commands`
8. Select the following bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Read Message History
   - Connect
   - View Channel
9. Copy the generated URL and use it to invite the bot to your server

### Deploying Slash Commands

Run the following command to register the slash commands with Discord:

```
node deploy-commands.js
```

### Starting the Bot

Run the following command to start the bot:

```
node index.js
```

## Commands

### Slash Commands

- `/stats [user]` - View voice activity statistics for yourself or a specified user
- `/leaderboard [limit]` - View server voice activity leaderboard (default: top 10 users)
- `/setpremium <user> <premium>` - Set a user's premium status (Admin only)

### Text Commands

- `!activity stats [@user]` - View your or mentioned user's voice activity stats
- `!activity leaderboard` - View server voice activity leaderboard
- `!activity help` - Show help message
- `!activity setpremium @user true/false` - Set user premium status (Admin only)

## Premium Features

The bot distinguishes between free and premium users. Premium users are marked with a star (⭐) in leaderboards and statistics.

Administrators can set a user's premium status using the `/setpremium` command or `!activity setpremium` command.

## Data Structure

The bot stores user activity data in MongoDB with the following structure:

- User ID and username
- Guild (server) ID and name
- Voice sessions with:
  - Start and end times
  - Channel information
  - Microphone status
  - Deafened status
  - Streaming status
  - Duration
- Total time spent in voice channels
- Premium status

## License

This project is licensed under the MIT License.
