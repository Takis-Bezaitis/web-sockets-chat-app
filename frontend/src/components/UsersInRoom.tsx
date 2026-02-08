import { memo } from "react";
import { usePresenceStore } from "../store/presenceStore";
import { useWebRTCStore } from "../store/webrtcStore";
import type { RoomUsers, RoomWithMembershipDTO, User } from "../types/custom";
import VideoCallButton from "./video/VideoCallButton";

interface UsersInRoomProps {
  currentRoomUsers: RoomUsers[];
  user: User | null;
  currentRoom: RoomWithMembershipDTO | undefined;
  mobileView?: string;
  videoOverlay?: string;
  setShowMembers?: (m: boolean) => void;
  onStartVideoCall?: () => void;
};

const UsersInRoom = ({ user, currentRoomUsers, currentRoom, mobileView, videoOverlay, setShowMembers, onStartVideoCall }: UsersInRoomProps) => {
  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const callState = useWebRTCStore((state) => state.callState);
  const isCaller = useWebRTCStore((state) => state.isCaller);

  return (
    <div className="flex flex-col h-full bg-component-background">
      {(mobileView !== "members" && videoOverlay !== "members") && (
        <div className="flex justify-end pt-2 pr-4">
          <span className="cursor-pointer text-xl hover:opacity-70" onClick={() => setShowMembers?.(false)}>✖</span>
      </div>
      )}
      
      <div className="p-2 overflow-y-auto no-scrollbar">
        {(currentRoomUsers.length === 1 && currentRoom?.creatorId === user?.id ) && (
          <p className="text-foreground">{!currentRoom?.isPrivate ? 'No members yet — you are the only one here.' : 
            'No members yet — you are the only one here. Invite others to join!'}</p>
        )} 

        {Array.isArray(currentRoomUsers) && currentRoomUsers.map((roomUser) => {
          if (user?.id === roomUser.id) return null;

          const isPresent = onlineUsers[roomUser.id];

          return (
            <div 
              key={roomUser.id} 
              className="group flex bg-surface m-2 rounded-md p-2 md:m-2 text-foreground items-center gap-3"
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

              <div className="flex flex-col text-lg overflow-hidden">
                <p className="text-lg truncate">{roomUser.username}</p>
              </div>

              <div className={`min-w-fit ml-auto 
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

export default memo(UsersInRoom);
