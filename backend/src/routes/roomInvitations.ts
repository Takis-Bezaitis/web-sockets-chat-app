import { Router } from "express";
import { inviteToRoom, getMyInvitations, getRoomInvitations, acceptRoomInvitation , declineRoomInvitation } from '../controllers/invitations/roomInvitationsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post('/', authMiddleware, asyncHandler(inviteToRoom));
router.get('/', authMiddleware, asyncHandler(getMyInvitations));
router.get('/room/:roomId', authMiddleware, asyncHandler(getRoomInvitations));
router.post('/:invitationId/accept', authMiddleware, asyncHandler(acceptRoomInvitation));
router.post('/:invitationId/decline', authMiddleware, asyncHandler(declineRoomInvitation));

export default router;