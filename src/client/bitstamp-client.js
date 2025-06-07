const WebSocket = require('ws');
const EventEmitter = require('events');
require('dotenv').config({path: './src/config/.env'});

class BitstampClient extends EventEmitter {
  constructor(cryptocurrencies) {
    super();
    this.cryptocurrencies = cryptocurrencies;
    this.ws = null;
  }

  connect() {
    if (this.ws) {
      console.log('Already connected or connecting');
      return;
    }

    this.ws = new WebSocket('wss://ws.bitstamp.net');

    this.ws.on('open', () => {
      console.log('Connected to BitStamp WebSocket API');
      this.cryptocurrencies.forEach(currency => {
        console.log(`Subscribing to ${currency} channel`);
        this.ws.send(JSON.stringify({
          event: 'bts:subscribe',
          data: { channel: `live_trades_${currency}` }
        }));
      });
      this.emit('open');
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        console.log('Received message:', parsed);
        if(parsed.event === 'trade') {
          this.emit('trade', parsed);
        }
      } catch (err) {
        console.error('Failed to parse message:', data);
      }
    });

    this.ws.on('error', (err) => {
      console.error('BitStamp WebSocket API connection error:', err);
      this.emit('error', err);
    });

    this.ws.on('close', () => {
      console.log('BitStamp WebSocket connection closed, reconnecting...');
      this.emit('close');
      this.ws = null;
      setTimeout(() => this.connect(), 3000); // Reconnect after 3 seconds
    });
  }
}

const allowedCryptocurrencySet = new Set(process.env.cryptocurrencies.split(',').map(e => e.trim()));
// Create the singleton instance
const bitstampClientInstance = new BitstampClient([...allowedCryptocurrencySet]);

// Connect immediately
bitstampClientInstance.connect();

module.exports = bitstampClientInstance;
