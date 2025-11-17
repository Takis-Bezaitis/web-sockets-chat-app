import { Server, Socket } from 'socket.io';
import { type UserPayload } from '../types/custom.js';
import { saveTheRoomMessage } from '../services/messages/messageService.js';

export interface CustomSocket extends Socket {
  user: UserPayload;
}

export default function chatSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const customSocket = socket as CustomSocket;
    console.log(`User connected: ${socket.id}`);

    // Join a room
    customSocket.on('joinRoom', (roomId: string) => {
      const user = customSocket.user;
      console.log(`${user.email} joined room ${roomId}`);
      customSocket.join(roomId);
      customSocket.to(roomId).emit("userJoined", { user, roomId });
    });

    // inside your chatSocket connection handler (customSocket)
    customSocket.on('leaveRoom', (roomId: string) => {
      const user = customSocket.user;
      console.log(`${user.email} left room ${roomId}`);
      customSocket.leave(roomId);
      customSocket.to(roomId).emit("userLeft", { user, roomId });
    });

    // Receive message and broadcast to room
    customSocket.on('chatMessage', async (data: { roomId: string; text: string }) => {
      const user = customSocket.user;
      console.log("data:", data)
      if (!user) return;

      const message = await saveTheRoomMessage({ text: data.text, userId: Number(user.id), roomId: Number(data.roomId) })
      console.log("message:", message)
      io.to(data.roomId).emit('newMessage', message);
    });

    customSocket.on('typing', (data: { user: string; roomId: string }) => {
      // Notify everyone *except* the sender
      customSocket.to(data.roomId).emit('userTyping', {
        user: data.user,
        roomId: data.roomId
      });
    });

    customSocket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
