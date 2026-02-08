import { type Request, type Response } from "express";
import type { AuthRequest, ApiResponse, InvitationDTO } from "../../types/custom.js";
import { createInvitation, findMyInvitations, acceptInvitation, declineInvitation } from "../../services/invitations/roomInvitationsService.js";
import { io } from "../../index.js";

export const inviteToRoom = async (
  req: Request & AuthRequest,
  res: Response<ApiResponse<InvitationDTO[]>>
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { roomId, inviteeIds } = req.body as {
      roomId: number;
      inviteeIds: number[];
    };

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roomId || !Array.isArray(inviteeIds)) {
      res.status(400).json({ error: "Missing or invalid roomId or inviteeIds." });
      return;
    }

    const invitations = await createInvitation({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send invitation." });
  }
};


export const getMyInvitations = async (req: Request & AuthRequest, res: Response<ApiResponse<InvitationDTO[]>>): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        
        const invitations = await findMyInvitations(Number(userId));

        res.status(200).json({ data: invitations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get the invitations." });
    }
};

export const getRoomInvitations = async () => {
};

export const acceptRoomInvitation = async (req: Request<{ invitationId: string }> & AuthRequest, 
    res: Response<ApiResponse<InvitationDTO | null>>): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { invitationId } = req.params;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const invitation = await acceptInvitation(Number(invitationId), Number(userId));

        if (!invitation) {
            res.status(404).json({ error: "Invitation not found or already handled." });
            return;
        }
        
        res.status(200).json({ data: invitation || null });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to accept the invitation." });
    }
};

export const declineRoomInvitation = async (req: Request<{ invitationId: string }> & AuthRequest,
    res: Response<ApiResponse<InvitationDTO | null>>): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { invitationId } = req.params;

            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const invitation = await declineInvitation(Number(invitationId), Number(userId));

            if (!invitation) {
                res.status(404).json({ error: "Invitation not found or already handled." });
                return;
            }

            res.status(200).json({ data: invitation || null });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to decline the invitation." });
        }
};