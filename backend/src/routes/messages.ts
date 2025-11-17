import { Router } from 'express';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllMessages, getRoomMessages, saveRoomMessage } from '../controllers/messages/messagesController.js';

const router = Router();
router.get('/all-messages', authMiddleware, getAllMessages);
router.get('/:roomId/room-messages', authMiddleware, getRoomMessages);
router.post('/:roomId/save-room-message', authMiddleware, saveRoomMessage);

export default router;
