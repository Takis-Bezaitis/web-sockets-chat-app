import { Router } from "express";
import { getRooms, createRoom, deleteRoom, joinRoom, getRoomUsers, leaveRoom, getUserRoomsWithMembership } from "../controllers/rooms/roomController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get('/', authMiddleware, asyncHandler(getRooms));
router.post('/create-room', authMiddleware, asyncHandler(createRoom));
router.delete('/:roomId', authMiddleware, asyncHandler(deleteRoom));
router.post('/:roomId/join', authMiddleware, asyncHandler(joinRoom));
router.post('/:roomId/leave', authMiddleware, asyncHandler(leaveRoom));
router.get('/:roomId/room-users', authMiddleware, asyncHandler(getRoomUsers));
router.get('/:userId/rooms', authMiddleware, asyncHandler(getUserRoomsWithMembership));

export default router;
