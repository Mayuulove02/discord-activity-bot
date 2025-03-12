// This endpoint is used by Vercel's cron job to keep the bot alive
module.exports = (req, res) => {
  const currentTime = new Date().toISOString();
  console.log(`Keepalive ping at ${currentTime}`);
  
  res.status(200).json({
    status: 'ok',
    message: 'Discord bot is alive',
    timestamp: currentTime
  });
};
