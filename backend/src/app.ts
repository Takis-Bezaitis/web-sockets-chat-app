import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import messageRoutes from './routes/messages.js';
import invitationRoutes from './routes/roomInvitations.js';
import usersRoutes from './routes/users.js';

const app = express();
app.set("trust proxy", 1);

// Middlewares
app.use(helmet());
app.disable("x-powered-by");

// rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],            
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/users', usersRoutes);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

export default app;
