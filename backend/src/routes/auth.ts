import { Router } from "express";
//import rateLimit from "express-rate-limit";

import { register, login, getMe, logout } from "../controllers/auth/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

import { asyncHandler } from "../utils/asyncHandler.js";

// for later use
/*const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => req.method === "OPTIONS",
  message: "Too many login attempts. Try again later.",
});*/

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(getMe));
router.post("/logout", asyncHandler(logout));

export default router;
