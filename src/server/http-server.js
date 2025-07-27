const express = require('express');
const app = express();
const port = 8080;

// Health check endpoint for Docker
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({message: 'server error'});
});

const httpServer = app.listen(port, () => {
  console.log(`App is listening at port ${port}`);
});

module.exports = httpServer;