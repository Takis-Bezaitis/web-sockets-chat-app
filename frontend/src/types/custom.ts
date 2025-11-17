export interface User {
    id: number;
    email: string;
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

// For AvailableRooms
export interface AvailableRoomsProps {
  rooms: RoomWithMembershipDTO[];
  currentRoom?: RoomWithMembershipDTO;
  onSelectRoom: (room: RoomWithMembershipDTO) => void;
  handleJoinLeaveRoom: (room: RoomWithMembershipDTO, action: string) => void;
};

// For UsersInRoom
export interface UsersInRoomProps {
  currentRoomUsers: RoomUsers[];
}

export interface Message {
  id: number;       
  userId: number;   
  email: string;    
  text: string;
  createdAt: string;
  roomId: number;
}

export type RoomWithMembershipDTO = {
  id: number;
  name: string;
  isMember: boolean;
};