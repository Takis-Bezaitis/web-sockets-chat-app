import { useEffect, useRef } from "react";
import { useWebRTCStore } from "../../store/webrtcStore";

export default function VideoCallWindow() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);
  const peerConnection = useWebRTCStore((s) => s.peerConnection);
  const setCallState = useWebRTCStore((s) => s.setCallState);
  const setLocalStream = useWebRTCStore((s) => s.setLocalStream);
  const setRemoteStream = useWebRTCStore((s) => s.setRemoteStream);
  const setPeerConnection = useWebRTCStore((s) => s.setPeerConnection);
  const resetCall = useWebRTCStore((s) => s.resetCall);

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
    peerConnection?.close();

    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

    resetCall();
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
