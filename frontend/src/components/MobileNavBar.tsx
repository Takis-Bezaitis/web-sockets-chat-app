import { useWebRTCStore } from "../store/webrtcStore";

interface MobileNavBarProps {
  mobileView: "chat" | "rooms" | "members" | "video";
  setMobileView: (v: "chat" | "rooms" | "members" | "video") => void;
  videoOverlay: "hidden" | "chat" | "members";
  setVideoOverlay: (v: "hidden" | "chat" | "members") => void;
}

const MobileNavBar = ({ mobileView, setMobileView, videoOverlay, setVideoOverlay }: MobileNavBarProps) => {
  const callState = useWebRTCStore((state) => state.callState);
  const inCall = callState === "inCall";
  const isCaller = useWebRTCStore((state) => state.isCaller);

  return (
    <div className="flex justify-center bg-component-background p-2 gap-10 text-xl border-t border-border-line">
      <button
        onClick={() => {
          if (inCall || (callState!="idle" && isCaller)) {
            setVideoOverlay(videoOverlay === "chat" ? "hidden" : "chat");
          } else {
            setMobileView("chat");
          }
        }}
        className={`cursor-pointer ${
          (!inCall && mobileView === "chat") ||
          (inCall && videoOverlay === "chat")
            ? "font-bold"
            : ""
        }`}
      >
        💬 Chat
      </button>

      <button
        disabled={callState!='idle'}
        onClick={() => setMobileView("rooms")}
        className={`${callState!='idle' ? 'cursor-default' : 'cursor-pointer'} ${mobileView === "rooms" ? "font-bold" : ""}`}
      >
        🏠 Rooms
      </button>

      <button
        onClick={() => {
          if (inCall || (callState !== "idle" && isCaller)) {
            setVideoOverlay(
              videoOverlay === "members" ? "hidden" : "members"
            );
          } else {
            setMobileView("members");
          }
        }}
        className="cursor-pointer"
      >
        👥 Members
      </button>
    </div>
  );
};

export default MobileNavBar;
