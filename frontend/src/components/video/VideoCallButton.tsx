import { useSocketStore } from "../../store/socketStore";
import { useWebRTCStore } from "../../store/webrtcStore";
import { type User } from "../../types/custom";

interface VideoCallButtonProps {
  calleeId: number;
  calleeName: string;
  callerId: number;
  roomId?: number | null;
  user: User | null;
  onCallStarted?: () => void;
};

const VideoCallButton = ({ calleeId, calleeName, roomId, callerId, user, onCallStarted }: VideoCallButtonProps) => {
  const { socket } = useSocketStore();
  const callState = useWebRTCStore((s) => s.callState);

  const setLocalStream = useWebRTCStore((s) => s.setLocalStream);
  const setCallState = useWebRTCStore((s) => s.setCallState);
  const setIsCaller = useWebRTCStore((s) => s.setIsCaller);
  const setRemoteUserId = useWebRTCStore((s) => s.setRemoteUserId);
  const setIncomingCaller = useWebRTCStore((s) => s.setIncomingCaller);
  const setOutcomingCallee = useWebRTCStore((s) => s.setOutcomingCallee);

  const startVideoHandler = async () => {
    if (!socket) return;
    if (callState !== "idle") return;

    try {
      // Caller gets media BEFORE sending request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Store stream in global state
      setLocalStream(stream);

      // Mark UI state
      setCallState("ringing");
      setIsCaller(true);
      setRemoteUserId(calleeId);
      setIncomingCaller({ id: callerId, username: user!.username });
      setOutcomingCallee({ id: calleeId, username: calleeName });

      // Send call request 
      socket.emit("video:call-request", {
        callerId,
        callerName: user!.username,
        calleeId,
        calleeName,
        roomId,
      });

      onCallStarted?.();
     
    } catch (err) {
      console.error("Failed to access media devices", err);
    }
  };

  const isDisabled = callState !== "idle";

  return (
    <div
      onClick={isDisabled ? undefined : startVideoHandler}
      className={`${isDisabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${isDisabled ? "fill-red-500" : "fill-green-500 hover:fill-green-800"} w-full h-full`} 
        viewBox="0 0 24 24" width="30" height="30">
        <path d="M17 10.5V6c0-1.1-.9-2-2-2H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4.5l4 4v-11l-4 4z" />
      </svg>
    </div>
  );
};

export default VideoCallButton;
