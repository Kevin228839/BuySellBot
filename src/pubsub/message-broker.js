const Redis = require('ioredis');
require('dotenv').config({path: './src/config/.env'});
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB) || 0
};
const subscriber = new Redis(redisConfig);
const publisher = new Redis(redisConfig);

subscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err);
});

publisher.on('error', (err) => {
  console.error('Redis Publisher Error:', err);
});

function registerMessageHandler(channelClients) {
  subscriber.on('message', (channel, message) => {
    const clients = channelClients.get(channel);
    if (!clients) return;

    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  });
}

module.exports = {
  subscriber,
  publisher,
  registerMessageHandler
};