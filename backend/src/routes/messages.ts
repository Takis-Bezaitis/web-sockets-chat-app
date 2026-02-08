import { Router } from 'express';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getAllMessages, getRoomMessages, saveRoomMessage, reactToMessage } from '../controllers/messages/messagesController.js';

const router = Router();
router.get('/all-messages', authMiddleware, getAllMessages); // not used
router.get('/:roomId/room-messages', authMiddleware, getRoomMessages);
router.post('/:roomId/save-room-message', authMiddleware, saveRoomMessage);
router.post('/messages/:messageId/react', authMiddleware, reactToMessage);

export default router;
