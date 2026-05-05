import { Router } from 'express';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllMessages, getRoomMessages, saveRoomMessage, reactToMessage } from '../controllers/messages/messagesController.js';
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get('/all-messages', authMiddleware, getAllMessages); // not used
router.get('/:roomId/room-messages', authMiddleware, asyncHandler(getRoomMessages));
router.post('/:roomId/save-room-message', authMiddleware, asyncHandler(saveRoomMessage));
router.post('/messages/:messageId/react', authMiddleware, asyncHandler(reactToMessage));

export default router;
