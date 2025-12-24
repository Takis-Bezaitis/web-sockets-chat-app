import { type UsersInRoomProps } from "../types/custom";
import { usePresenceStore } from "../store/presenceStore";
import { useWebRTCStore } from "../store/webrtcStore";
import VideoCallButton from "./video/VideoCallButton";

const UsersInRoom = ({ user, currentRoomUsers, currentRoom, onStartVideoCall }: UsersInRoomProps) => {
  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const callState = useWebRTCStore((state) => state.callState);
  const isCaller = useWebRTCStore((state) => state.isCaller);

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
              className="group flex bg-surface m-2 rounded-md p-2 md:ml-16 md:mr-16 lg:m-2 text-foreground items-center gap-3 relative "
            >
              <div className="relative text-3xl leading-none">
                <span>👤</span>
                <span
                  className={`
                    absolute bottom-0 right-0 block w-3 h-3 rounded-full translate-y-1
                    ${isPresent ? "bg-green-500" : "bg-red-500"}
                  `}
                />
              </div>

              <div className="flex flex-col text-lg">
                <p className="font-medium">{roomUser.username}</p>
              </div>

              <div className={`absolute right-2 
                ${((isCaller && callState!=="idle") || (!isCaller && callState!=="idle")) ? 'pointer-events-none' : ''}`}>
                <VideoCallButton
                  calleeId={roomUser.id}
                  calleeName={roomUser.username}
                  callerId={user!.id}
                  roomId={currentRoom?.id}
                  user={user}
                  onCallStarted={onStartVideoCall}
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
