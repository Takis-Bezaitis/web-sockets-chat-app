import prisma from "../../prismaClient.js";
import type { InvitationDTO } from "../../types/custom.js";

type CreateInvitationProps = {
  inviterId: number;
  roomId: number;
  inviteeIds: number[];
};

export const createInvitation = async ({
  inviterId,
  roomId,
  inviteeIds,
}: CreateInvitationProps): Promise<InvitationDTO[]> => {
  if (inviteeIds.length === 0) return [];

  const validUsers = await prisma.user.findMany({
    where: { id: { in: inviteeIds } },
    select: { id: true },
  });

  const validInviteeIds = validUsers.map((u) => u.id);
  if (validInviteeIds.length === 0) return [];

  const existingInvitations = await prisma.roomInvitation.findMany({
    where: {
      roomId,
      inviteeId: { in: validInviteeIds },
    },
    select: { inviteeId: true },
  });

  const alreadyInvitedIds = new Set(
    existingInvitations.map((inv) => inv.inviteeId)
  );

  const finalInviteeIds = validInviteeIds.filter(
    (id) => !alreadyInvitedIds.has(id)
  );

  if (finalInviteeIds.length === 0) return [];

  const invitations = await Promise.all(
    finalInviteeIds.map((inviteeId) =>
      prisma.roomInvitation.create({
        data: {
          inviterId,
          roomId,
          inviteeId,
        },
        include: {
          inviter: {
            select: { id: true, username: true },
          },
          room: {
            select: { id: true, name: true },
          },
        },
      })
    )
  );

  return invitations.map((inv) => ({
    id: inv.id,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    acceptedAt: inv.acceptedAt?.toISOString() || null,
    inviteeId: inv.inviteeId,

    inviter: {
      id: inv.inviter.id,
      username: inv.inviter.username,
    },

    room: {
      id: inv.room.id,
      name: inv.room.name,
    },
  }));
};


export const findMyInvitations = async (
  userId: number
): Promise<InvitationDTO[]> => {
  const invitations = await prisma.roomInvitation.findMany({
    where: { inviteeId: userId, status: "PENDING" },
    include: {
      inviter: {
        select: {
          id: true,
          username: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    status: inv.status,
    createdAt: inv.createdAt.toISOString(),
    acceptedAt: inv.acceptedAt?.toISOString() || null,
    inviteeId: inv.inviteeId,

    inviter: {
      id: inv.inviter.id,
      username: inv.inviter.username,
    },

    room: {
      id: inv.room.id,
      name: inv.room.name,
    },
  }));
};


export const acceptInvitation = async (
  invitationId: number,
  userId: number
): Promise<InvitationDTO | null> => {
  const invitation = await prisma.roomInvitation.findUnique({
    where: { id: invitationId },
    include: {
      inviter: { select: { id: true, username: true } },
      room: { select: { id: true, name: true } },
    },
  });

  if (!invitation || invitation.inviteeId !== userId || invitation.status !== "PENDING") {
    return null;
  }

  const updatedInvitation = await prisma.roomInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
    include: {
      inviter: { select: { id: true, username: true } },
      room: { select: { id: true, name: true } },
    },
  });

  return {
    id: updatedInvitation.id,
    inviteeId: updatedInvitation.inviteeId,
    status: updatedInvitation.status,
    createdAt: updatedInvitation.createdAt.toISOString(),
    acceptedAt: updatedInvitation.acceptedAt?.toISOString() || null,
    inviter: {
      id: updatedInvitation.inviter.id,
      username: updatedInvitation.inviter.username,
    },
    room: {
      id: updatedInvitation.room.id,
      name: updatedInvitation.room.name,
    },
  };
};


export const declineInvitation = async (invitationId: number, userId: number): Promise<InvitationDTO | null> => {
  const invitation = await prisma.roomInvitation.findFirst({
    where: {
      id: invitationId,
      inviteeId: userId,
      status: "PENDING",
    },
    include: {
      inviter: { select: { id: true, username: true } },
      room: { select: { id: true, name: true } },
    },
  });

  if (!invitation || invitation.inviteeId !== userId || invitation.status !== "PENDING") {
    return null;
  }

  const updatedInvitation = await prisma.roomInvitation.update({
    where: { id: invitationId },
    data: { status: "DECLINED", acceptedAt: null },
    include: {
      inviter: { select: { id: true, username: true } },
      room: { select: { id: true, name: true } },
    },
  });

  return {
    id: updatedInvitation.id,
    inviteeId: updatedInvitation.inviteeId,
    status: updatedInvitation.status,
    createdAt: updatedInvitation.createdAt.toISOString(),
    acceptedAt: updatedInvitation.acceptedAt?.toISOString() || null,
    inviter: {
      id: updatedInvitation.inviter.id,
      username: updatedInvitation.inviter.username,
    },
    room: {
      id: updatedInvitation.room.id,
      name: updatedInvitation.room.name,
    },
  };
}