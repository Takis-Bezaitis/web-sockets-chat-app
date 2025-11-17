import { Router } from "express";
import { getRooms, joinRoom, getRoomUsers, leaveRoom, getUserRoomsWithMembership } from "../controllers/rooms/roomController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get('/', getRooms);
router.post('/:roomId/join', authMiddleware, joinRoom);
router.post('/:roomId/leave', authMiddleware, leaveRoom);
router.get('/:roomId/room-users', getRoomUsers);
router.get('/:userId/rooms', getUserRoomsWithMembership);

export default router;
