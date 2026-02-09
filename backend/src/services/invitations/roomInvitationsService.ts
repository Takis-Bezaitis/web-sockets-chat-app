import prisma from "../../prismaClient.js";
import type { InvitationDTO } from "../../types/custom.js";

type inviteToRoomProps = {
  inviterId: number;
  roomId: number;
  inviteeIds: number[];
};

export const inviteToRoom = async ({
  inviterId,
  roomId,
  inviteeIds,
}: inviteToRoomProps): Promise<InvitationDTO[]> => {
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
    select: {
      inviteeId: true,
      status: true,
    },
  });

  const declinedInviteeIds = existingInvitations
    .filter((inv) => inv.status === "DECLINED")
    .map((inv) => inv.inviteeId);

  const alreadyInvitedIds = new Set(
    existingInvitations.map((inv) => inv.inviteeId)
  );

  let revivedInvitations: InvitationDTO[] = [];

  if (declinedInviteeIds.length > 0) {
    await prisma.roomInvitation.updateMany({
      where: {
        roomId,
        inviteeId: { in: declinedInviteeIds },
        status: "DECLINED",
      },
      data: {
        status: "PENDING",
        inviterId,
      },
    });

    const revived = await prisma.roomInvitation.findMany({
      where: {
        roomId,
        inviteeId: { in: declinedInviteeIds },
        status: "PENDING",
      },
      include: {
        inviter: {
          select: { id: true, username: true },
        },
        room: {
          select: { id: true, name: true },
        },
      },
    });

    revivedInvitations = revived.map((inv) => ({
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
  }

  const newInviteeIds = validInviteeIds.filter(
    (id) => !alreadyInvitedIds.has(id)
  );

  const newInvitations = await Promise.all(
    newInviteeIds.map((inviteeId) =>
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

  const createdInvitations: InvitationDTO[] = newInvitations.map((inv) => ({
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

  return [...revivedInvitations, ...createdInvitations];
};



export const getMyInvitations = async (
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


export const acceptRoomInvitation = async (
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


export const declineRoomInvitation = async (invitationId: number, userId: number): Promise<InvitationDTO | null> => {
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