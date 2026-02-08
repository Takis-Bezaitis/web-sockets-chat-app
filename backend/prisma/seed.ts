import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("MySecret123!", 10);

  const alice = await prisma.user.upsert({
    where: { username: "Alice" },
    update: {},
    create: {
      username: "Alice",
      email: "alice@example.com",
      password: hashedPassword,
    },
  });

  const generalRoom = await prisma.room.upsert({
    where: { name: "general" },
    update: {},
    create: {
      name: "general",
      isPrivate: false,
      creatorId: alice.id,
    },
  });

  await prisma.userRoom.upsert({
    where: {
      userId_roomId: {
        userId: alice.id,
        roomId: generalRoom.id,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      roomId: generalRoom.id,
    },
  });

  console.log("Seed completed: Alice created and added to #general");
}

main()
  .catch((e) => console.error("Seed failed:", e))
  .finally(async () => await prisma.$disconnect());
