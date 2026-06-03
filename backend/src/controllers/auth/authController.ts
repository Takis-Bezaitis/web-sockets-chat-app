import { type Request, type Response } from "express";
import ms from "ms";

import { registerUser, loginUser, refreshAccessToken } from "../../services/auth/authService.js";
import { registerSchema, loginSchema } from "../../validation/authValidation.js";
import { AppError } from "../../utils/AppError.js";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;

if (!JWT_EXPIRES_IN) {
  throw new Error("Missing JWT_EXPIRES_IN");
}

export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.parse(req.body);
    const { username, email, password } = parsed;

    const user = await registerUser(username, email, password);
    res.json(user);
};

export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: ".onrender.com",
      maxAge: ms("7d"), 
      path: "/",
    });

    res.json({
      ...user,
      token: accessToken,
    });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("🔁 refresh called");
  console.log("🍪 refreshToken:", refreshToken);

  if (!refreshToken) {
    throw new AppError("No refresh token", 401);
  }

  const result = await refreshAccessToken(refreshToken);

  res.json(result);
};

// not used
/*export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new AppError("Not authenticated", 401);
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
  });
};*/

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: ".onrender.com",
    path: "/",
  });
  res.json({ message: "Logged out" });
};
