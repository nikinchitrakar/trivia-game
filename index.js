const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const players = [];
const messages = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/change-name', (req, res) => {
  const name = req.body.name;
  const socketId = req.body.socketId;
  const player = players.find(p => p.socketId === socketId);
  if (name && player) {
    const exists = players.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (exists) {
      res.status(400).send({'message': 'Name already exists'});
    } else {
      player.name = name;
      res.send({'message': 'Name changed'});
    }
  }
});

app.get('/messages', (req, res) => {
  res.send(messages);
});

io.on('connection', (socket) => {
  console.log('connected', socket.id);
  players.push({
    "socketId": socket.id,
    "name": "",
  });

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
  });

  socket.on('message', (message) => {
    console.log('message: ' + message.text);
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('nameChange', (data) => {
    const name = data.name;

  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});