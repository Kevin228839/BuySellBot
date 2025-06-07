const Redis = require('ioredis');
const redis = new Redis();

class RSI {
  constructor(client, period = 14) {
    this.period = period;
    this.redis = redis;

    // Per-currency state: store prevPrice, avgGain, avgLoss, count
    this.state = {};

    client.on('trade', (rawTrade) => this.handleTrade(rawTrade));
  }

  initState(currency) {
    if (!this.state[currency]) {
      this.state[currency] = {
        prevPrice: null,
        avgGain: 0,
        avgLoss: 0,
        count: 0, // count of price changes processed
      };
    }
    return this.state[currency];
  }

  async handleTrade(rawTrade) {
    if (!rawTrade || rawTrade.event !== 'trade' || !rawTrade.data || !rawTrade.channel) {
      return;
    }
    const currency = rawTrade.channel.replace('live_trades_', '');
    const price = parseFloat(rawTrade.data.price);
    if (isNaN(price)) return;

    const state = this.initState(currency);

    if (state.prevPrice === null) {
      state.prevPrice = price;
      return;
    }

    const change = price - state.prevPrice;
    state.prevPrice = price;

    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (state.count < this.period) {
      // Calculate initial average gain/loss (simple average)
      state.avgGain = ((state.avgGain * state.count) + gain) / (state.count + 1);
      state.avgLoss = ((state.avgLoss * state.count) + loss) / (state.count + 1);
      state.count++;
    } else {
      // Wilder's smoothing
      state.avgGain = (state.avgGain * (this.period - 1) + gain) / this.period;
      state.avgLoss = (state.avgLoss * (this.period - 1) + loss) / this.period;
    }

    if (state.count >= this.period) {
      const rs = state.avgLoss === 0 ? 100 : state.avgGain / state.avgLoss;
      const rsi = 100 - (100 / (1 + rs));

      const key = `${currency}_rsi`;
      try {
        await this.redis.publish(key, JSON.stringify({ rsi, timestamp: Date.now() }));
      } catch (error) {
        console.error('Failed to publish RSI to Redis:', error);
      }
      console.log(`[${currency}] RSI: ${rsi.toFixed(2)}`);
    }
  }
}

module.exports = RSI;
