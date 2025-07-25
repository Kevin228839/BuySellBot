const Redis = require('ioredis');
const subscriber = new Redis();
const publisher = new Redis();

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