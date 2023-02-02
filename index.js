const express = require('express');
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// App
// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessions({
  secret: "108",
  saveUninitialized: true,
  resave: false,
  cookie: { maxAge: oneDay }
}));

// Entities
const players = [];
const messages = [];
const lobbies = [];

// Functions
const getPlayer = (req) => {
  let player = players.find(p => p.sessionId === req.session.id);
  if (!player) {
    player = {
      "sessionId": req.session.id,
      "socketId": null,
      "name": "",
      "disconnected": false
    };
    players.push(player);
  }

  return player;
}

// API
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/player', (req, res) => {
  const player = getPlayer(req);
  const name = req.body.name;
  const socketId = req.body.socketId;
  const errors = [];

  if (socketId) {
    player.socketId = socketId;
  }

  if (name) {
    const exists = players.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (exists) {
      errors.push({
        'name': 'Must be unique'
      });
    } else {
      player.name = name;
    }
  }

  if (errors.length > 0) {
    res.status(400).send({ 'message': 'Invalid inputs', 'errors': errors });
  } else {
    res.send({ 'message': 'Player updated', player });
  }
});

app.get('/player', (req, res) => {
  const player = getPlayer(req);
  res.send({ player, messages });
});

// Socket
io.on('connection', (socket) => {
  console.log('connected', socket.id);

  socket.on('disconnect', () => {
    const player = players.find(p => p.socketId == socket.id);
    if (player) {
      player.disconnected = true;
    }
    console.log('disconnected', socket.id);
  });

  socket.on('message', (message) => {
    console.log('message: ' + message.text);
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('createLobby', (player) => {
    console.log(player);
  });
});

// Server
server.listen(3000, () => {
  console.log('listening on *:3000');
});