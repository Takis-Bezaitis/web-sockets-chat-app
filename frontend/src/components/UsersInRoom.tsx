import { type UsersInRoomProps } from "../types/custom";
import { usePresenceStore } from "../store/presenceStore";
import VideoCallButton from "./video/VideoCallButton";

const UsersInRoom = ({ user, currentRoomUsers, currentRoom }: UsersInRoomProps) => {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  return (
    <div className="flex flex-col h-full bg-component-background border-l border-border-line">
      <header className="text-foreground p-3 text-lg h-14 border-b border-border-line">
        Members
      </header>
      <div className="p-4 overflow-y-auto no-scrollbar">
        {Array.isArray(currentRoomUsers) && currentRoomUsers.map((roomUser) => {
          if (user?.id === roomUser.id) return null;

          const isPresent = onlineUsers[roomUser.id];

          return (
            <div 
              key={roomUser.id} 
              className="group flex bg-surface m-2 rounded-md p-2 text-foreground items-center gap-3 relative cursor-pointer"
            >

              {/* Avatar container */}
              <div className="relative text-3xl leading-none">
                <span>👤</span>

                {/* Status dot */}
                <span
                  className={`
                    absolute bottom-0 right-0 block w-3 h-3 rounded-full translate-y-1
                    ${isPresent ? "bg-green-500" : "bg-red-500"}
                  `}
                />
              </div>

              {/* User info */}
              <div className="flex flex-col text-lg">
                <p className="font-medium">{roomUser.username}</p>
              </div>

              {/* Video call button (only visible on hover) */}
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <VideoCallButton
                  calleeId={roomUser.id}
                  calleeName={roomUser.username}
                  callerId={user!.id}
                  roomId={currentRoom?.id}
                  user={user}
                />
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsersInRoom;
