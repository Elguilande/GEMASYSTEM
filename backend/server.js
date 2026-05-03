const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const arquivos = {};

app.get('/', (req, res) => {
  res.send('✅ Gema Backend is running - WebSocket active');
});

io.on('connection', (socket) => {
  console.log(`📡 Cliente conectado: ${socket.id}`);

  socket.on('enviarDados', (dados) => {
    arquivos[dados.nome] = dados.conteudo;
    socket.emit('dadosRecebidos', {
      status: 'sucesso',
      mensagem: `Arquivo ${dados.nome} armazenado!`
    });
  });

  socket.on('pedirDados', (nome) => {
    socket.emit('dadosRetornados', {
      nome,
      conteudo: arquivos[nome] || null
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Gema Backend rodando na porta ${PORT}`);
});
