const httpServer = require('./src/server/http-server');
const wss = require('./src/server/websocket-server');
require('./src/strategy/rsi-strategy');

httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});