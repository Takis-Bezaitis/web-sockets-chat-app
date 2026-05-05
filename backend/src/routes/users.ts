import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllUsers } from "../controllers/users/usersController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authMiddleware, asyncHandler(getAllUsers));

export default router;
