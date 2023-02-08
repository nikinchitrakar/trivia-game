const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { uuid } = require('uuidv4');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const players = [];
const messages = [];
const lobbies = [];

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

app.post('/create_lobby', (req, res) => {
  const player = req.body.player;
  const lobby = createLobby(player);
  res.send({'message': `Lobby created with ID: ${lobby.id}. Share this link: http://localhost:3000/lobby/${lobby.id}`});
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

function createLobby(player) {
  return {
    id: uuid(),
    questions: [],
    owner: player.socketId,
    creator: player.socketId,
    current_question: null,
    round: 0,
    state: 'pending',
    round_end_time: 10,
    time_left_ticker: 0,
    time_new: 0
  }
}

app.get('/lobby/:id', (req, res) => {
  res.send(`You have joined lobby with ID: ${req.params.id}`);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});