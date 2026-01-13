import prisma from "../../prismaClient.js";
import type { PublicUserDTO } from "../../types/custom.js";

// Used for room invitations – not for pagination
export const findAllUsers = async (excludeUserId: number): Promise<PublicUserDTO[]> => {
  return prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true, username: true },
    orderBy: { username: "asc" }
  });
};
