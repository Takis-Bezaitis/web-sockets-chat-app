import { type Request, type Response } from "express";
import type { AuthRequest, ApiResponse, InvitationDTO } from "../../types/custom.js";
import * as invitationService from "../../services/invitations/roomInvitationsService.js";
import { AppError } from "../../utils/AppError.js";

import { io } from "../../index.js";

export const inviteToRoom = async (
  req: Request & AuthRequest,
  res: Response<ApiResponse<InvitationDTO[]>>
): Promise<void> => {
    const userId = req.user?.id;
    const { roomId, inviteeIds } = req.body as {
      roomId: number;
      inviteeIds: number[];
    };

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!roomId || !Array.isArray(inviteeIds)) {
      throw new AppError("Missing or invalid roomId or inviteeIds.", 400);
    }

    const invitations = await invitationService.inviteToRoom({
      inviterId: Number(userId),
      roomId: Number(roomId),
      inviteeIds,
    });

    invitations.forEach((inv) => {
      io.to(`user:${inv.inviteeId}`).emit("room:invited", {
        invitation: inv,
      });
    });

    res.status(201).json({ data: invitations });
};


export const getMyInvitations = async (req: Request & AuthRequest, res: Response<ApiResponse<InvitationDTO[]>>): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }
    
    const invitations = await invitationService.getMyInvitations(Number(userId));
    res.status(200).json({ data: invitations });
};

export const getRoomInvitations = async () => {
};

export const acceptRoomInvitation = async (req: Request<{ invitationId: string }> & AuthRequest, 
    res: Response<ApiResponse<InvitationDTO | null>>): Promise<void> => {
      const userId = req.user?.id;
      const { invitationId } = req.params;

      if (!userId) {
          throw new AppError("Unauthorized", 401);
      }

      const invitation = await invitationService.acceptRoomInvitation(Number(invitationId), Number(userId));

      res.status(200).json({ data: invitation || null });
};

export const declineRoomInvitation = async (req: Request<{ invitationId: string }> & AuthRequest,
    res: Response<ApiResponse<InvitationDTO | null>>): Promise<void> => {
      const userId = req.user?.id;
      const { invitationId } = req.params;

      if (!userId) {
          throw new AppError("Unauthorized", 401);
      }

      const invitation = await invitationService.declineRoomInvitation(Number(invitationId), Number(userId));
      res.status(200).json({ data: invitation || null });
};