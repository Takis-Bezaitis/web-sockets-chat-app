// DTOs (Data Transfer Objects)
import { type Request } from "express";
import { InvitationStatus as PrismaInvitationStatus } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
};

export type RoomDTO = {
  id: number;
  name: string;
  isPrivate?: boolean;
  creatorId: number;
  hasUserMessages: boolean;
};

export type ApiResponse<T> = 
  | { data: T }
  | { error: string };

export type UserRoomDTO = {
  user: { id: number; username: string; email: string };
  room: { id: number; name: string; isPrivate?: boolean; };
  joinedAt?: string;
};

export type RoomUsers = {
  id: number;
  username: string;
  email: string;
};

export type UserPayload = {
  id: string;
  email: string;
};

export interface MessageReaction {
  userId: number;
  username: string;
  emoji: string;
};

export interface Message {
  id: number;       
  userId: number;   
  email: string;    
  text: string;
  createdAt: string;
  roomId: number;
  reactions?: MessageReaction[];
};

export type MessageDTO = {
  id: number;
  userId: number;
  email: string;
  text: string;
  createdAt: string;
  roomId: number;
  username: string;
  reactions?: MessageReaction[];
};

export type RoomWithMembershipDTO = {
  id: number;
  name: string;
  isMember: boolean;
  isPrivate: boolean;
  creatorId: number;
  hasUserMessages: boolean;
};

export type InvitationDTO = {
  id: number;
  status: PrismaInvitationStatus;
  createdAt: string;
  acceptedAt: string | null;
  inviteeId: number;

  inviter: {
    id: number;
    username: string;
  };

  room: {
    id: number;
    name: string;
  };
};

export type PublicUserDTO = {
  id: number;
  username: string;
};

