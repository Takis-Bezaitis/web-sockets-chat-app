import { Router } from "express";
import { inviteToRoom, getMyInvitations, getRoomInvitations, acceptRoomInvitation , declineRoomInvitation } from '../controllers/invitations/roomInvitationsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post('/', authMiddleware, inviteToRoom);
router.get('/', authMiddleware, getMyInvitations);
router.get('/room/:roomId', authMiddleware, getRoomInvitations);
router.post('/:invitationId/accept', authMiddleware, acceptRoomInvitation);
router.post('/:invitationId/decline', authMiddleware, declineRoomInvitation);

export default router;