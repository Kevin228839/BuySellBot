const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';
if (env == 'docker') {
  dotenv.config({ path: path.join(__dirname, '.env.docker') });
} else {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

module.exports = {
  cryptocurrencies: process.env.cryptocurrencies,
  channels: process.env.channels,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB
};
