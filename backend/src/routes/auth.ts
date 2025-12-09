import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { type AuthRequest } from "../types/custom.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;

if (!JWT_SECRET || !JWT_EXPIRES_IN) {
  throw new Error("Missing JWT environment variables");
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, username: true, email: true, createdAt: true }
    });

    // Ensure general room exists
    const generalRoom = await prisma.room.upsert({
      where: { name: "general" },
      update: {},
      create: { name: "general" }
    });

    // Add user to general room
    await prisma.userRoom.create({
      data: {
        userId: user.id,
        roomId: generalRoom.id
      }
    });

    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email} });
    if (!existingUser) {
      return res.status(400).json({ error: 'User does not exist.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Password is not correct.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: existingUser.id, email: existingUser.email, username: existingUser.username},
      JWT_SECRET,
      { expiresIn: '5h'}
    );

    // Send HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true, // prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // set true if using HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // prevents CSRF attcks
      maxAge: 5000 * 60 * 60, // 5 hours
      path: '/',               // ✅ ensures cookie is sent to all routes
      // domain: '.myapp.com', // ✅ uncomment if backend & frontend share a root domain (e.g. api.myapp.com + myapp.com)
    });

    res.json({
      id: existingUser.id,
      username: existingUser.username,
      email: existingUser.email,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { id, email, username } = user;
    res.json({ user: { id, email, username } });
  } catch {
    res.status(500).json({ error: "Something went wrong" });
  }
});



export default router;