# About
Buysellbot is a trading signal generation bot. It uses the Bitstamp WebSocket API to subscribe to live trade data for a set of cryptocurrencies. It then processes this data to generate signals.
# How it works
1. The bot connects to the Bitstamp WebSocket API and subscribes to live trade data for a set of cryptocurrencies.
2. It then processes this data to generate signals.
3. The WebSocket server then sends these signals to all connected clients.
# How to run
1. Clone the repository
2. Install dependencies
  ```bash
  npm install
  ```
3. Create a .env file in the src/config folder and add the following example variables:
   - cryptocurrencies=btcusd,ethusd
   - channels=btcusd_rsi,ethusd_rsi
4. Run the bot
  ```bash
  nodemon index.js
  ```
5. Connect to the WebSocket server
  ```postman
  ws://localhost:8080/stream
  ```
6. Subscribe to a channel
  ```json
  {"action": "subscribe", "channel": "btcusd_rsi"}
  ```
7. Receive signals
  ```json-example
  {"rsi": 50.0, "timestamp": 1692222222222}
  ```