import { type Request, type Response } from "express";
import { registerUser, loginUser } from "../../services/auth/authService.js";
import { type AuthRequest } from "../../types/custom.js";
import { registerSchema, loginSchema } from "../../validation/authValidation.js";
import { z, ZodError } from "zod";

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const { username, email, password } = parsed;

    const user = await registerUser(username, email, password);
    res.json(user);

  } catch (error) {
    if (error instanceof ZodError) {
        return res.status(400).json({ errors: error.issues });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const { user, token } = await loginUser(email, password);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 5, // 5 hours
      path: "/",
    });

    res.json(user);

  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
 
    res.status(400).json({ error: (error as Error).message || "Something went wrong" });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  res.json({ user: { id: user.id, email: user.email, username: user.username } });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Logged out" });
};
