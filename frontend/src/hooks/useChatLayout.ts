import { useEffect, useState } from "react";
import { useWebRTCStore } from "../store/webrtcStore";

export type MobileView = "chat" | "rooms" | "members" | "video";
export type VideoOverlay = "hidden" | "chat" | "members";

export const useChatLayout = () => {
  const callState = useWebRTCStore((s) => s.callState);
  const isCaller = useWebRTCStore((s) => s.isCaller);

  const inCall = callState === "inCall";

  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [videoOverlay, setVideoOverlay] = useState<VideoOverlay>("hidden");
  const [showMembers, setShowMembers] = useState(false);

  // drive layout from call state
  useEffect(() => {
    if (callState === "inCall" || (callState === "ringing" && isCaller)) {
      setMobileView("video");
      return;
    }

    setVideoOverlay("hidden");
    setMobileView("chat");
  }, [callState, isCaller]);

  return {
    mobileView,
    videoOverlay,
    showMembers,

    setMobileView,
    setVideoOverlay,
    setShowMembers,

    inCall,
    callState,
    isCaller,
  };
};
