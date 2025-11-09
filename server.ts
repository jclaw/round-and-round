import express from 'express';
import { get } from 'express/lib/response';
import socket from 'socket.io';

const app = express();

const port = 3000;

app.use(express.static('dist'));

const server = app.listen(port);

console.log(`Server running at http://localhost:${port}`);

const io = new socket.Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});


const getCount = () => io.of("/").sockets.size;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  io.sockets.emit('updateUserCount', { count: getCount() });

  socket.on('mouse', mouseMessage);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    io.sockets.emit('updateUserCount', { count: getCount() });
  });

  function mouseMessage(data: { x: number; y: number }) {
    socket.broadcast.emit('mouse', data);
    console.log('Mouse data received:', data);
  }
});

