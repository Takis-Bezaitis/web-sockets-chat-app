import { useEffect, useRef } from "react";
import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";

export default function VideoCallWindow() {
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
    console.log("remoteStream changed:", remoteStream?.getTracks().map(t => t.kind));
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

  console.log("localStream:",localStream)
  console.log("remoteStream:",remoteStream)

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-50">

      <div className="flex gap-4">
        {/* Local video */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-48 h-36 rounded-lg border border-gray-700 bg-black"
        />

        {/* Remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-96 h-72 rounded-lg border border-gray-700 bg-black"
        />
      </div>

      <button
        onClick={endCall}
        className="mt-6 bg-red-600 px-6 py-3 rounded-lg text-white text-lg cursor-pointer"
      >
        End Call
      </button>
    </div>
  );
}
