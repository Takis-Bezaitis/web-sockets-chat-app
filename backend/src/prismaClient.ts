import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); 

prisma.$connect()
  .then(() => console.log("✅ Prisma connected"))
  .catch((err) => {
    console.error("❌ Prisma failed to connect", err);
    process.exit(1);
  });

export default prisma;