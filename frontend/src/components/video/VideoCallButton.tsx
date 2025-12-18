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
  const setLocalStream = useWebRTCStore((s) => s.setLocalStream);
  const setCallState = useWebRTCStore((s) => s.setCallState);
  const setIsCaller = useWebRTCStore((s) => s.setIsCaller);
  const setRemoteUserId = useWebRTCStore((s) => s.setRemoteUserId);
  const setIncomingCaller = useWebRTCStore((s) => s.setIncomingCaller);
  const setOutcomingCallee = useWebRTCStore((s) => s.setOutcomingCallee);

  const startVideoHandler = async () => {
    if (!socket) return;

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

  return (
    <div
      onClick={startVideoHandler}
      className="text-xl hover:text-blue-500 cursor-pointer"
    >
      🎥
    </div>
  );
};

export default VideoCallButton;
