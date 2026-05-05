import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import prisma from "../../prismaClient.js";
import { AppError } from "../../utils/AppError.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;

if (!JWT_SECRET || !JWT_EXPIRES_IN) {
  throw new Error("Missing JWT environment variables");
}

export const registerUser = async (username: string, email: string, password: string) => {
  if (!username || !email || !password) throw new AppError("All fields are required", 400);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError("Email already in use", 409);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  // Ensure general room exists
  const generalRoom = await prisma.room.upsert({
    where: { name: "general" },
    update: {},
    create: { name: "general", isPrivate: false, creatorId: 1 },
  });

  await prisma.userRoom.create({ data: { userId: user.id, roomId: generalRoom.id } });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("User does not exist", 404);

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new AppError("Invalid credentials", 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN, 
      issuer: "chat-app", 
      audience: "chat-app-users", 
    } as SignOptions 
  );

  return { user: { id: user.id, username: user.username, email: user.email }, token };
};
