//Import express
import express from 'express';
import socket from 'socket.io';

// Create the Express app
const app = express();

// Set the port used for server traffic.
const port = 3000;

// Middleware to serve static files from 'dist' directory
app.use(express.static('dist'));

//Run server at port
const server = app.listen(port);

console.log(`Server running at http://localhost:${port}`);

const io = new socket.Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.sockets.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('mouse', mouseMessage);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  function mouseMessage(data: { x: number; y: number }) {
    // Broadcast the mouse data to all other clients
    socket.broadcast.emit('mouse', data);
    console.log('Mouse data received:', data);
  }
});

