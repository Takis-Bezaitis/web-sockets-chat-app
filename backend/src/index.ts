import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import chatSocket from './sockets/chatSocket.js';
import { socketAuthMiddleware } from "./sockets/socketAuth.js";
import prisma from "./prismaClient.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, 
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Apply auth middleware before any socket connects
io.use(socketAuthMiddleware);

// Initialize socket handlers
chatSocket(io);

async function startServer() {
  let retries = 10;

  while (retries) {
    try {
      await prisma.$connect();
      console.log("✅ Prisma connected");

      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });

      return;
    } catch (err) {
      console.error("❌ Prisma failed to connect. Retrying...");
      retries--;

      await new Promise(res => setTimeout(res, 2000));
    }
  }

  console.error("❌ Could not connect to database after retries.");
  process.exit(1);
}

startServer();

