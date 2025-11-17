import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import chatSocket from './sockets/chatSocket.js';
import { socketAuthMiddleware } from "./sockets/socketAuth.js";
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // later replace '*' with frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// 🔑 Apply auth middleware before any socket connects
io.use(socketAuthMiddleware);

// Initialize socket handlers
chatSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

