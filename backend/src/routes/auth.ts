import { Router } from "express";
import rateLimit from "express-rate-limit";

import { register, login, getMe, logout } from "../controllers/auth/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => req.method === "OPTIONS",
  message: "Too many login attempts. Try again later.",
});

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);

export default router;
