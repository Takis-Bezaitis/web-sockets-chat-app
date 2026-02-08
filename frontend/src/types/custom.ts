export interface User {
    id: number;
    email: string;
    username: string;
};

export type ApiResponse<T> = 
  | { data: T }
  | { error: string };

export type RoomDTO = {
  id: number;
  name: string;
  isPrivate?: boolean;
  creatorId: number;
  hasUserMessages: boolean;
};

export type RoomUsers = {
    id: number;
    username: string;
    email: string;
};

export interface MessageReaction {
  userId: number;
  username: string;
  emoji: string;
}

export interface MessageReactionEvent {
  messageId: number;
  reaction: MessageReaction;
}

export interface Message {
  id: number;       
  userId: number;   
  email: string;    
  text: string;
  createdAt: string;
  roomId: number;
  username: string;
  reactions: MessageReaction[];
}

export type RoomWithMembershipDTO = {
  id: number;
  name: string;
  isMember: boolean;
  isPrivate: boolean;
  creatorId: number;
  hasUserMessages: boolean;
};

type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED"

export type InvitationDTO = {
  id: number;
  status: InvitationStatus;
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

