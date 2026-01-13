import type {  User, RoomWithMembershipDTO } from "../../types/custom";

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
  const filteredRooms = rooms.filter((r) => !r.isPrivate || r.isMember);

  return (
    <div className="flex flex-col h-full bg-component-background border-r border-border-line">
      <div className="bg-component-background text-foreground h-14 flex items-center border-b border-border-line">
        <div className="flex ml-4 gap-2 place-items-center">
          <div className="text-3xl">👤</div>
          <div className="text-xl">{user.username}</div>
        </div>
      </div>

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
            className={`flex gap-3 flex-wrap justify-between mx-5 my-2 rounded-md p-2 
              ${room.name === currentRoom?.name
                ? "bg-surface-selected cursor-default"
                : "bg-surface cursor-pointer"
            }`}
          >
            <div
              className={`text-lg ${
                room.name === currentRoom?.name
                  ? "italic font-bold text-surface-selected"
                  : "text-foreground"
              }`}
            >
              # {room.name} 
            </div>
            
            {(room.name !== "general" && (room.creatorId === user.id && room.isPrivate)) && (
              <button className="cursor-pointer" onClick={() => onInviteMembers(room.id, room.name)}>👤+</button>
            )}

            {(room.name !== "general" && room.creatorId !== user.id) && (
              <div className="flex gap-2">
                <button
                  className={`bg-button-main text-white px-4 rounded hover:bg-button-hover disabled:bg-button-disabled
                    ${room.isMember ? 'cursor-default' : 'cursor-pointer'} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinLeaveRoom(room, "join");
                  }}
                  disabled={room.isMember}
                >
                  JOIN
                </button>

                <button
                  className={`bg-button-main text-white px-4 rounded hover:bg-button-hover disabled:bg-button-disabled
                    ${room.isMember ? 'cursor-pointer' : 'cursor-default'} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinLeaveRoom(room, "leave");
                  }}
                  disabled={!room.isMember}
                >
                  LEAVE
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>

    </div>
  );
};

export default ChatSidebar;
