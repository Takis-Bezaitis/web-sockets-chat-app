import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import invitationRoutes from './routes/roomInvitations.js';
import usersRoutes from './routes/users.js';

const app = express();

// Middlewares 
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,               
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/users', usersRoutes);

export default app;
