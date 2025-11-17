// DTOs (Data Transfer Objects)
import { type Request } from "express";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
};

export type RoomDTO = {
  id: number;
  name: string;
};

export type ApiResponse<T> = 
  | { data: T }
  | { error: string };

export type UserRoomDTO = {
  user: { id: number; username: string; email: string };
  room: { id: number, name: string };
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

export interface Message {
  id: number;       
  userId: number;   
  email: string;    
  text: string;
  createdAt: string;
  roomId: number;
}

export type MessageDTO = {
  id: number;
  userId: number;
  email: string;
  text: string;
  createdAt: string;
  roomId: number;
};


export type RoomWithMembershipDTO = {
  id: number;
  name: string;
  isMember: boolean;
};
