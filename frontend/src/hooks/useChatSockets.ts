import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { useWebRTCStore } from "../store/webrtcStore";

import {
  handleCallRequest,
  setCallerOnVideoCallStatus,
  handleCallResponse,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
  onCallEnded,
} from "../features/webrtc/videoSocketHandlers";

const HEARTBEAT_INTERVAL = 25_000;

export const useChatSockets = (currentRoomId?: number) => {
  const { socket, connect, disconnect } = useSocketStore();

  /* =============================
     1. SOCKET CONNECT / DISCONNECT
     ============================= */
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  /* =============================
     2. VIDEO SOCKET EVENTS
     ============================= */
  useEffect(() => {
    if (!socket) return;

    socket.on("video:call-request", handleCallRequest);
    socket.on("video:user-onvideo-call", setCallerOnVideoCallStatus);
    socket.on("video:call-response", handleCallResponse);
    socket.on("video:webrtc-offer", handleOffer);
    socket.on("video:webrtc-answer", handleAnswer);
    socket.on("video:webrtc-ice-candidate", handleIceCandidate);
    socket.on("video:call-ended", onCallEnded);

    socket.on("video:remote-media-state", ({ micMuted, cameraOff }) => {
      useWebRTCStore.getState().setRemoteMediaState({
        micMuted,
        cameraOff,
      });
    });

    return () => {
      socket.off("video:call-request", handleCallRequest);
      socket.off("video:user-onvideo-call", setCallerOnVideoCallStatus);
      socket.off("video:call-response", handleCallResponse);
      socket.off("video:webrtc-offer", handleOffer);
      socket.off("video:webrtc-answer", handleAnswer);
      socket.off("video:webrtc-ice-candidate", handleIceCandidate);
      socket.off("video:call-ended", onCallEnded);
      socket.off("video:remote-media-state");
    };
  }, [socket]);

  /* PRESENCE HEARTBEAT */
  useEffect(() => {
    if (!socket || !socket.connected || !currentRoomId) return;

    socket.emit("presence:heartbeat", String(currentRoomId));

    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("presence:heartbeat", String(currentRoomId));
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [socket, currentRoomId]);
};
