import type { RoomWithMembershipDTO } from "../../types/custom";

type RoomActionsProps = {
  room: RoomWithMembershipDTO;
  handleJoinLeaveRoom: (r: RoomWithMembershipDTO, action: "join" | "leave") => void;
};

const RoomActions = ({ room, handleJoinLeaveRoom }: RoomActionsProps) => {
  return (
    <div className="flex justify-end gap-2.5 ml-auto text-xl">
      {/* Join button */}
      <button
        title="Join channel"
        className={`w-10 flex ${room.isMember ? 'hidden' : 'cursor-pointer hover:text-green-500 transition-colors'}`}
        onClick={(e) => {
          e.stopPropagation();
          handleJoinLeaveRoom(room, "join");
        }}
        disabled={room.isMember}
      >
        <p>👤</p>+
      </button>

      {/* Leave button */}
      <button
        title="Leave channel"
        className={`w-10 flex ${room.isMember ? 'cursor-pointer hover:text-red-500 transition-colors' : 'hidden'}`}
        onClick={(e) => {
          e.stopPropagation();
          handleJoinLeaveRoom(room, "leave");
        }}
        disabled={!room.isMember}
      >
        <p>👤</p>-
      </button>
    </div>
  );
};

export default RoomActions;
