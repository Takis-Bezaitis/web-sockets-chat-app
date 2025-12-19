import { useEffect, useRef } from "react";
import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";
import VideoControls from "./VideoControls";
import { useAuthStore } from "../../store/authStore";

type VideoCallWindowProps = {
  caller: string | undefined;
  callee: string | undefined;
  onEndCall?: () => void;
}

const VideoCallWindow = ({caller, callee, onEndCall}: VideoCallWindowProps) => {
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { socket } = useSocketStore();

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);
  const remoteUserId = useWebRTCStore((s) => s.remoteUserId);
  const cleanupCall = useWebRTCStore((s) => s.cleanupCall);

  // Attach video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Cleanup when window closes
  const endCall = () => {
    if (socket?.connected && remoteUserId) {
      socket.emit("video:call-ended", {
        targetUserId: remoteUserId,
      });
    }

    cleanupCall();
    onEndCall?.();
  };

  return (
    <div className="h-full flex flex-col items-center place-content-center p-4 bg-background border-r border-border-line">

      <div className="grid grid-cols-1 gap-1 w-full max-w-lg">
        {/* Local video */}
        <p className="text-foreground">{user?.username}</p>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-5">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover bg-video-chat-window"
          />
        </div>

        {/* Remote video */}
        <p className="text-foreground">{`${caller===user?.username ? callee : caller}`}</p>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-video-chat-callee"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <VideoControls onEndCall={endCall} />
      </div>

    </div>
  );
}

export default VideoCallWindow;