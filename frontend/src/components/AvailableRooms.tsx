import { type AvailableRoomsProps } from "../types/custom";

const AvailableRooms = ({
  rooms,
  currentRoom,
  onSelectRoom,
  handleJoinLeaveRoom,
}: AvailableRoomsProps) => {

  return (
    <div className="flex flex-col w-2/5 max-w-xs bg-component-background border-r border-border-line">
      <header className="text-foreground p-4">AvailableRooms</header>

      {rooms.map((room) => {
        return (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`flex gap-3 flex-wrap justify-between m-2 rounded-md p-2 cursor-pointer ${
              room.name === currentRoom?.name
                ? "bg-selected-room"
                : "bg-room"
            }`}
          >
            <div
              className={`${
                room.name === currentRoom?.name
                  ? "text-blue-800 italic font-bold"
                  : "text-white"
              }`}
            >
              #{room.name} {room.isMember}
            </div>

            {room.id !== 1 && (
              <div className="flex gap-2">
                <button
                  className={`bg-blue-500 text-white px-4 rounded hover:bg-blue-600 disabled:opacity-50
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
                  className={`bg-blue-500 text-white px-4 rounded hover:bg-blue-600 disabled:opacity-50
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

export default AvailableRooms;
