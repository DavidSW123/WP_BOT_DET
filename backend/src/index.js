require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const apiRoutes = require('./routes/api');
const { sendMessage, handleIncomingMessage } = require('./services/meta');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api', apiRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desconectado'));
});

// Webhook Meta
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const msgData = await handleIncomingMessage(req.body);
  if (msgData) {
    io.emit('new_message', msgData);
  }
});

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.sendStatus(403);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Backend en puerto ${PORT}`));
