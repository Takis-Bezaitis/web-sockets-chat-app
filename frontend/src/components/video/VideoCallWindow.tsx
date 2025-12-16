import { useEffect, useRef } from "react";
import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";

type VideoCallWindowProps = {
  caller: string | undefined;
  callee: string | undefined;
}

const VideoCallWindow = ({caller, callee}: VideoCallWindowProps) => {
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
  };

  return (
    <div className="h-full flex flex-col items-center place-content-center p-4">

      <div className="grid grid-cols-1 gap-1 w-full max-w-lg">
        {/* Local video */}
        <p className="text-foreground">{caller}</p>
        <div className="relative w-full aspect-video bg-background rounded-xl overflow-hidden mb-5">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Remote video */}
        <p className="text-foreground">{callee}</p>
        <div className="relative w-full aspect-video bg-video-chat-callee rounded-xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={endCall}
          className="bg-red-600 px-6 py-3 rounded-lg text-white text-lg cursor-pointer"
        >
          End Call
        </button>
      </div>
    </div>

  );
}

export default VideoCallWindow;