// server/test-server.js
const express = require('express');
const app = express();
const PORT = 3001; // Інший порт, щоб не конфліктувати

app.get('/', (req, res) => {
  res.send('Test server running!');
});

// Маршрут з параметром
app.get('/api/test/:id', (req, res) => {
  res.send(`ID from test: ${req.params.id}`);
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});