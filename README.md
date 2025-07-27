# About
Buysellbot is a trading signal generation bot. It uses the Bitstamp WebSocket API to subscribe to live trade data for a set of cryptocurrencies. It then processes this data to generate signals.
# How it works
1. The bot connects to the Bitstamp WebSocket API and subscribes to live trade data for a set of cryptocurrencies.
2. It then processes this data to generate signals.
3. The WebSocket server then sends these signals to all connected clients.
# How to run the bot
1. Clone the repository
2. Create a .env file under the folder: src/config/ 
4. Run the bot
  ```bash
  docker-compose up --build
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
  {"key":"ethusd_rsi","rsi":59.229167305411444,"timestamp":1753608051241}
  ```