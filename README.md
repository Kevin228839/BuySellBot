# BuySellBot - Cryptocurrency Trading Signal Bot

## 📖 Overview

BuySellBot is a real-time cryptocurrency trading signal generation system that calculates **Relative Strength Index (RSI)** indicators for multiple cryptocurrency pairs. It connects to the Bitstamp WebSocket API to receive live trade data, processes it to generate RSI signals, and streams these signals to connected clients via WebSocket.

## 🎯 Purpose

This bot helps traders monitor RSI indicators in real-time across multiple cryptocurrency pairs. RSI is a momentum indicator that measures the speed and magnitude of price changes, helping identify overbought or oversold conditions:
- **RSI > 70**: Potentially overbought (sell signal)
- **RSI < 30**: Potentially oversold (buy signal)

## 🏗️ Architecture

The system consists of the following components:

### Core Components

1. **Bitstamp Client** (`src/client/bitstamp-client.js`)
   - Connects to Bitstamp WebSocket API
   - Subscribes to live trade channels for configured cryptocurrencies
   - Emits trade events for processing
   - Handles automatic reconnection on connection loss

2. **RSI Strategy** (`src/strategy/rsi-strategy.js`)
   - Listens for trade events from Bitstamp client
   - Calculates RSI using Wilder's smoothing method with configurable period (default: 7)
   - Publishes RSI values to Redis pub/sub channels
   - Maintains state for each cryptocurrency pair

3. **Message Broker** (`src/pubsub/message-broker.js`)
   - Redis-based pub/sub system
   - Publisher: Sends RSI signals to Redis channels
   - Subscriber: Receives signals and forwards to connected WebSocket clients

4. **WebSocket Server** (`src/server/websocket-server.js`)
   - Accepts client connections on `ws://localhost:8080/stream`
   - Handles subscribe/unsubscribe requests from clients
   - Manages client subscriptions to specific channels
   - Broadcasts RSI signals to subscribed clients

5. **HTTP Server** (`src/server/http-server.js`)
   - Provides health check endpoint for monitoring
   - Handles WebSocket upgrade requests

### Data Flow

```
Bitstamp API → BitstampClient → RSI Strategy → Redis Pub/Sub → WebSocket Server → Clients
                  (Trade Data)     (Calculate)    (Distribute)     (Stream)
```

## ⚙️ How It Works

1. **Connection**: The bot establishes a WebSocket connection to Bitstamp and subscribes to live trade channels for configured cryptocurrency pairs (e.g., BTC/USD, ETH/USD).

2. **Data Processing**: 
   - Each incoming trade updates the RSI calculation
   - RSI is calculated using the last 7 price changes (configurable)
   - Uses Wilder's smoothing method for accurate RSI calculation

3. **Signal Distribution**:
   - RSI values are published to Redis channels
   - Redis distributes signals to the WebSocket server
   - Subscribed clients receive real-time RSI updates

4. **Client Streaming**: 
   - Clients connect via WebSocket
   - Subscribe to specific channels (e.g., `btcusd_rsi`)
   - Receive continuous RSI updates as trades occur

## 🚀 Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- OR **Node.js** 18+ and **Redis** 7+ (for local development)

### Installation & Setup

#### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kevin228839/BuySellBot.git
   cd BuySellBot
   ```

2. **Configure environment**
   ```bash
   cp src/config/.env.docker.template src/config/.env.docker
   ```
   
   Edit `src/config/.env.docker` to customize cryptocurrencies and channels:
   ```env
   cryptocurrencies=btcusd,ethusd
   channels=btcusd_rsi,ethusd_rsi
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

3. **Run the bot**
   ```bash
   docker-compose up --build
   ```

   The bot will:
   - Start Redis container
   - Build and start the application container
   - Connect to Bitstamp and begin calculating RSI
   - Listen for WebSocket connections on port 8080

#### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Redis**
   ```bash
   # On macOS with Homebrew
   brew services start redis
   
   # On Linux
   sudo systemctl start redis
   ```

3. **Configure environment**
   ```bash
   cp src/config/.env.template src/config/.env
   ```
   
   Edit `src/config/.env` with your settings.

4. **Run the bot**
   ```bash
   npm run dev  # Development with auto-reload
   # OR
   node index.js  # Production
   ```

## 📡 Using the WebSocket API

### Connect to the Server

```javascript
const ws = new WebSocket('ws://localhost:8080/stream');
```

Or using a tool like Postman:
```
ws://localhost:8080/stream
```

### Subscribe to a Channel

Send a JSON message to subscribe to RSI updates:

```json
{
  "action": "subscribe",
  "channel": "btcusd_rsi"
}
```

**Available channels** (based on default configuration):
- `btcusd_rsi` - Bitcoin/USD RSI indicator
- `ethusd_rsi` - Ethereum/USD RSI indicator

**Response**:
```
Subscription succeeded!
```

### Receive RSI Signals

Once subscribed, you'll receive real-time RSI updates:

```json
{
  "channel": "btcusd_rsi",
  "rsi": 59.229167305411444,
  "timestamp": 1753608051241
}
```

### Unsubscribe from a Channel

```json
{
  "action": "unsubscribe",
  "channel": "btcusd_rsi"
}
```

**Response**:
```
Unsubscription succeeded!
```

## 🔧 Configuration

### Environment Variables

Located in `src/config/.env` or `src/config/.env.docker`:

| Variable | Description | Example |
|----------|-------------|---------|
| `cryptocurrencies` | Comma-separated list of currency pairs to track | `btcusd,ethusd,xrpusd` |
| `channels` | Comma-separated list of allowed channels | `btcusd_rsi,ethusd_rsi` |
| `REDIS_HOST` | Redis server hostname | `localhost` or `redis` (Docker) |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password (if required) | `` (empty for no auth) |
| `REDIS_DB` | Redis database number | `0` |

### RSI Strategy Configuration

The RSI period can be adjusted in `src/strategy/rsi-strategy.js`:

```javascript
const rsiInstance = new RSI(bitstampClient, publisher, 7); // Default: 7 periods
```

Common periods:
- **7**: More sensitive, faster signals (current default)
- **14**: Standard RSI period (traditional)
- **21**: Less sensitive, slower signals

## 🏥 Health Check

The application provides a health check endpoint:

```bash
curl http://localhost:8080/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-14T11:03:31.438Z",
  "uptime": 123.456
}
```

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Bitstamp
- **Check**: Internet connectivity
- **Check**: Bitstamp API status at https://status.bitstamp.net/

**Problem**: Redis connection failed
- **Check**: Redis is running (`docker ps` or `redis-cli ping`)
- **Check**: REDIS_HOST and REDIS_PORT in `.env` file

### WebSocket Issues

**Problem**: "Invalid message format" error
- **Ensure**: You're sending valid JSON with `action` and `channel` fields
- **Ensure**: The channel is in the allowed channels list

**Problem**: No RSI signals received
- **Check**: You've subscribed to a valid channel
- **Check**: Bitstamp connection is active (check console logs)
- **Wait**: Initial RSI calculation requires several trades (7+ by default)

### Docker Issues

**Problem**: Container exits immediately
- **Check**: Configuration file exists at `src/config/.env.docker`
- **Check**: Docker logs: `docker-compose logs app`

**Problem**: Port 8080 already in use
- **Solution**: Change port in `docker-compose.yml`:
  ```yaml
  ports:
    - "8081:8080"  # Map to different external port
  ```

## 💡 Example Use Cases

### 1. Trading Bot Integration

Connect your automated trading bot to receive real-time RSI signals and execute trades based on overbought/oversold conditions.

### 2. Alert System

Build a notification system that alerts you when RSI crosses specific thresholds (e.g., RSI < 30 or RSI > 70).

### 3. Multi-Pair Monitoring Dashboard

Create a dashboard that displays RSI for multiple cryptocurrency pairs simultaneously.

### 4. Backtesting Data Collection

Record RSI signals over time for strategy backtesting and optimization.

## 🔒 Security Considerations

- The bot runs as a non-root user in Docker for security
- No authentication is implemented on the WebSocket server (consider adding for production)
- Redis connection has no password by default (configure for production)
- Health check endpoint is publicly accessible

## 📦 Dependencies

- **express** - HTTP server framework
- **ws** - WebSocket library
- **ioredis** - Redis client
- **dotenv** - Environment variable management

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional technical indicators (MACD, Bollinger Bands, etc.)
- Authentication and rate limiting
- Web-based dashboard
- Historical data storage
- Alert configurations

## 📄 License

ISC

## 📧 Support

For issues and questions, please open an issue on the GitHub repository.