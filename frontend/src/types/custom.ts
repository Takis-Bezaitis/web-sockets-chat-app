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
};

export type RoomUsers = {
    id: number;
    username: string;
    email: string;
};

// For ChatSidebar
export interface ChatSidebarProps {
  user: User;
  rooms: RoomWithMembershipDTO[];
  currentRoom?: RoomWithMembershipDTO;
  onSelectRoom: (room: RoomWithMembershipDTO) => void;
  handleJoinLeaveRoom: (room: RoomWithMembershipDTO, action: "join" | "leave") => void;
};

// For UsersInRoom
export interface UsersInRoomProps {
  currentRoomUsers: RoomUsers[];
  user: User | null;
  currentRoom: RoomWithMembershipDTO | undefined;
  onStartVideoCall?: () => void;
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
};