const WebSocket = require('ws');
const Redis = require('ioredis');
require('dotenv').config({path: './src/config/.env'});
const subscriber = new Redis();
const channelClients = new Map();
const allowedCryptocurrencySet = new Set(process.env.cryptocurrencies.split(',').map(e => e.trim()));
const allowedActionSet = new Set(['subscribe', 'unsubscribe']);

const wss = new WebSocket.Server({
  noServer: true,
  path: '/stream'
});

wss.on('connection', (ws) => {
  ws.on('error', (err) => {
    console.error(err);
  });
  ws.on('message', async (message) => {
    let { action, channel } = JSON.parse(message.toString());
    if (!(allowedActionSet.has(action)) || !(allowedCryptocurrencySet.has(channel))) {
      ws.send('Invalid message format. Expected: {action: "subscribe"|"unsubscribe", channel: "btc"|"eth"}');
      return;
    }
    if (action === 'subscribe') {
      if (!channelClients.has(channel)) {
        try {
          await subscriber.subscribe(channel);
        } catch(err) {
          console.error(`Failed to subscribe to ${channel}:`, err);
          ws.send('Subscription failed!');
          return;
        }
        channelClients.set(channel, new Set());
      }
      channelClients.get(channel).add(ws);
      ws.send('Subscription succeeded!');
      return;
    }
    if (action === 'unsubscribe') {
      if(channelClients.get(channel)?.delete(ws)) {
        if (channelClients.get(channel).size === 0) {
          try {
            await subscriber.unsubscribe(channel);
            channelClients.delete(channel);
          } catch(err) {
            console.error(`Failed to unsubscribe from ${channel}:`, err);
          }
        }
      }
      ws.send('Unsubscription succeeded!');
      return;
    }
  });
  ws.on('close', async () => {
    for (const [channel, clients] of channelClients.entries()) {
      clients.delete(ws);
      if (clients.size === 0) {
        try {
          await subscriber.unsubscribe(channel);
          channelClients.delete(channel);
        } catch(err) {
          console.error(`Failed to unsubscribe from ${channel}:`, err);
        }
      }
    }
  });
});

subscriber.on('message', (channel, message) => {
  channelClients.get(channel).forEach((ws) => {
    ws.send(message);
  });
});

module.exports = wss;