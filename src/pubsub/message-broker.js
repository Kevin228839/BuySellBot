const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = require('../config/configuration');
const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB
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