import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllUsers } from "../controllers/users/usersController.js";

const router = Router();

router.get("/", authMiddleware, getAllUsers);

export default router;
