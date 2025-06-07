const httpServer = require('./src/server/http-server');
const wss = require('./src/server/websocket-server');
const bitstampClient = require('./src/client/bitstamp-client');
const RSI = require('./src/strategy/rsi-strategy');
const rsi = new RSI(bitstampClient, 7);

httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});