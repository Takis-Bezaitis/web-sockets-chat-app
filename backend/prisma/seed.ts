import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if "general" room exists
  let generalRoom = await prisma.room.findUnique({
    where: { name: 'general' }
  });
  console.log("test 1")
  if (!generalRoom) {
    console.log("test 2")
    generalRoom = await prisma.room.create({
      data: {
        name: 'general',
      },
    });
    console.log('Created default room: general');
  } else {
    console.log('Room "general" already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// npx prisma db seed    it doesn't work
//npx tsx ./prisma/seed.ts  it created the Room