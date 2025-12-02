import { type ChatSidebarProps } from "../types/custom";

const ChatSidebar = ({
  user,
  rooms,
  currentRoom,
  onSelectRoom,
  handleJoinLeaveRoom,
}: ChatSidebarProps) => {

  return (
    <div className="flex flex-col w-2/5 max-w-xs bg-component-background border-r border-border-line">
      <div className="bg-component-background text-foreground h-14 flex items-center mx-2">
        <div className="flex gap-2 place-items-center">
          <div className="text-3xl">👤</div>
          <div className="text-xl">{user.username}</div>
        </div>
      </div>

      <header className="text-foreground p-4">Available Chat Rooms</header>
      {rooms.map((room) => {
        return (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`flex gap-3 flex-wrap justify-between m-2 rounded-md p-2 cursor-pointer ${
              room.name === currentRoom?.name
                ? "bg-surface-selected"
                : "bg-surface"
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

            {room.id !== 1 && (
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
  );
};

export default ChatSidebar;
