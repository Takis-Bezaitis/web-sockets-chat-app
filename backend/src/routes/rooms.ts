import { Router } from "express";
import { getRooms, createRoom, deleteRoom, joinRoom, getRoomUsers, leaveRoom, getUserRoomsWithMembership } from "../controllers/rooms/roomController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get('/', authMiddleware, getRooms);
router.post('/create-room', authMiddleware, createRoom);
router.delete('/:roomId', authMiddleware, deleteRoom);
router.post('/:roomId/join', authMiddleware, joinRoom);
router.post('/:roomId/leave', authMiddleware, leaveRoom);
router.get('/:roomId/room-users', authMiddleware, getRoomUsers);
router.get('/:userId/rooms', authMiddleware, getUserRoomsWithMembership);

export default router;
