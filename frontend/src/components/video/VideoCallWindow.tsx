import { useEffect, useRef } from "react";
import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";
import { usePresenceStore } from "../../store/presenceStore";
import VideoControls from "./VideoControls";
import { useAuthStore } from "../../store/authStore";
import MicMutedIcon from "./icons/MicMutedIcon";
import CameraOffIcon from "./icons/CameraOffIcon";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type VideoCallWindowProps = {
  caller: string | undefined;
  callee: { id: number | undefined, name: string | undefined};
  videoOverlay: "hidden" | "chat" | "members";
}

const VideoCallWindow = ({caller, callee, videoOverlay }: VideoCallWindowProps) => {
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { socket } = useSocketStore();

  const localStream = useWebRTCStore((s) => s.localStream);
  const remoteStream = useWebRTCStore((s) => s.remoteStream);
  const remoteUserId = useWebRTCStore((s) => s.remoteUserId);
  const cleanupCall = useWebRTCStore((s) => s.cleanupCall);
  const isCameraOff = useWebRTCStore((s) => s.isCameraOff);
  const isRemoteMicMuted = useWebRTCStore((s) => s.isRemoteMicMuted);
  const isRemoteCameraOff = useWebRTCStore((s) => s.isRemoteCameraOff);
  const callState = useWebRTCStore((s) => s.callState);

  const getOnlineStatus = usePresenceStore((s) => s.onlineUsers)

  const isCalleeOnline = !!(callee.id && getOnlineStatus[callee.id]);
  
  const isSmall = useMediaQuery("(max-width: 768px)");

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
    <div
      className={`
        ${isSmall ? 'min-h-full' : 'h-full'}
        flex flex-col items-center
        ${videoOverlay === "hidden" ? "justify-center" : "justify-start pt-16"}
        p-4 bg-background border-r border-border-line
      `}
    >

      <div className={`grid grid-cols-1 ${isSmall ? 'w-3/4 -mt-10' : 'w-full max-w-xl'}`}>

        {/* Remote video */}
        <p className="text-foreground text-lg">{`${caller===user?.username ? callee.name : caller}`}</p>
        <div className="relative content-center bg-video-chat-callee w-full aspect-video 
          rounded-xl overflow-hidden mb-10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`transition-all duration-200 absolute inset-0 w-full h-full object-cover bg-video-chat-callee 
              ${(isRemoteCameraOff || !isCalleeOnline || remoteStream === null) ? 'opacity-0' : 'opacity-100'}`}
          />
          {isRemoteCameraOff && (
            <div className="flex flex-col items-center justify-center align-middle text-6xl text-gray-300">
              <span>👤</span>
              <span className="text-lg mt-2 text-foreground">Camera off</span>
            </div>
          )}

          {!isCalleeOnline && (
            <div className="flex flex-col items-center justify-center align-middle text-6xl text-gray-300">
              <span>👤</span>
              <span className="text-lg mt-2 text-foreground">{callee.name} is currently offline.</span>
            </div>
          )}

          {isCalleeOnline && callState !== "inCall" && (
            <div className="flex flex-col items-center justify-center align-middle text-6xl text-gray-300">
              <span>👤</span>
              <span className="text-lg mt-2 text-foreground">Waiting for {callee.name} to join…</span>
            </div>
          )}

          <div className="w-full absolute flex justify-end top-0 p-1 gap-2">
            {isRemoteMicMuted && (
              <div className="w-8 h-8 p-1 rounded-full flex items-center justify-center bg-gray-500"><MicMutedIcon />
              </div>
            )}
            {isRemoteCameraOff && (
              <div className="w-8 h-8 p-1 rounded-full flex items-center justify-center bg-gray-500"><CameraOffIcon />
              </div>
            )}
          </div>
        </div>

        {/* Local video */}
        <p className="text-foreground text-lg">{user?.username}</p>
        <div className="relative content-center bg-video-chat-window w-full aspect-video rounded-xl overflow-hidden mb-3">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`transition-all duration-200 absolute inset-0 w-full h-full object-cover bg-video-chat-window
              ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isCameraOff && (
            <div className="flex flex-col items-center justify-center align-middle text-6xl text-gray-300">
              <span>👤</span>
              <span className="text-lg mt-2 text-foreground">Camera off</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6">
          <VideoControls onEndCall={endCall} />
        </div>
        
      </div>

    </div>
  );
}

export default VideoCallWindow;