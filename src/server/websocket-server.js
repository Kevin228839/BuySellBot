const WebSocket = require('ws');
const { subscriber, registerMessageHandler } = require('./../pubsub/message-broker');
require('dotenv').config({path: './src/config/.env'});
const allowedChannelsSet = new Set(process.env.channels.split(',').map(e => e.trim()));
const allowedActionSet = new Set(['subscribe', 'unsubscribe']);

const channelClients = new Map();
registerMessageHandler(channelClients);

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
    if (!(allowedActionSet.has(action)) || !(allowedChannelsSet.has(channel))) {
      ws.send('Invalid message format. Expected: {action: "subscribe"|"unsubscribe", channel: "btcusd_rsi"|"btcusd_rsi"}');
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

module.exports = wss;