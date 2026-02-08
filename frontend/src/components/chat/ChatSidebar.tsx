import { memo, useMemo } from "react";
import type {  User, RoomWithMembershipDTO } from "../../types/custom";
import RoomActions from "./RoomActions";

interface ChatSidebarProps {
  user: User;
  rooms: RoomWithMembershipDTO[];
  currentRoom?: RoomWithMembershipDTO;
  onSelectRoom: (room: RoomWithMembershipDTO) => void;
  handleJoinLeaveRoom: (room: RoomWithMembershipDTO, action: "join" | "leave") => void;
  onCreateRoom: () => void;
  onInviteMembers: (roomId: number, roomName: string) => void;
};

const ChatSidebar = ({
  user,
  rooms,
  currentRoom,
  onSelectRoom,
  handleJoinLeaveRoom,
  onCreateRoom,
  onInviteMembers,
}: ChatSidebarProps) => {
  const filteredRooms = useMemo(
  () => rooms.filter((r) => !r.isPrivate || r.isMember),
  [rooms]
);


  return (
    <div className="flex flex-col h-full bg-component-background">
      <div className="flex items-center justify-between pt-4 pb-2">
        <header className="text-foreground ml-5 text-lg">Channels ({filteredRooms.length})</header>
        <div className="cursor-pointer mr-5" onClick={onCreateRoom}>➕</div>
      </div>
      
      <div className="overflow-y-auto no-scrollbar">
      {filteredRooms.map((room) => {
        return (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`mx-5 my-2 rounded-md p-2
              ${room.name === currentRoom?.name
                ? "bg-surface-selected cursor-default"
                : "bg-surface cursor-pointer"
            }`}
          >

            <div className="flex justify-between items-center">
              <div
                className={`text-lg overflow-hidden ${
                  room.name === currentRoom?.name
                    ? "italic font-bold text-surface-selected"
                    : "text-foreground"
                }`}
              >
                <h3 className="truncate">{room.isPrivate ? <span className="not-italic">🔒</span> : '#'} {room.name}</h3>
              </div>

              {(room.name !== "general" && room.creatorId != user.id) && (
                <RoomActions
                  room={room}
                  handleJoinLeaveRoom={handleJoinLeaveRoom}
                />
              )}

              <div className="min-w-fit">
                {(room.name !== "general" && (room.creatorId === user.id && room.isPrivate)) && (
                  <button className="cursor-pointer" onClick={() => onInviteMembers(room.id, room.name)}>📩</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>

    </div>
  );
};

export default memo(ChatSidebar);
