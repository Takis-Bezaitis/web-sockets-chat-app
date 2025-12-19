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
    <div className="flex justify-center bg-component-background gap-x-16 text-xl border-t border-border-line">
      <button
        onClick={() => {
          if (inCall || (callState!="idle" && isCaller)) {
            setVideoOverlay(videoOverlay === "chat" ? "hidden" : "chat");
          } else {
            setMobileView("chat");
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" 
          className={`cursor-pointer ${
          (!inCall && mobileView === "chat") ||
          (inCall && videoOverlay === "chat")
            ? "icon-color-selected"
            : "icon-color"
        }`}
        >
          <path d="M2 3H22V17H6L2 21V3Z"/>
          <path d="M6 9L12 13L18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button
        disabled={callState!='idle'}
        onClick={() => setMobileView("rooms")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"
          className={`${callState!='idle' ? 'cursor-default' : 'cursor-pointer'} 
          ${mobileView === "rooms" ? "icon-color-selected" : "icon-color"}`}
        >
          <rect x="3" y="3" width="8" height="8"/>
          <rect x="13" y="3" width="8" height="8"/>
          <rect x="3" y="13" width="8" height="8"/>
          <rect x="13" y="13" width="8" height="8"/>
        </svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="38" height="38" fill="currentColor"
          className={`${((mobileView === "members") || (videoOverlay === "members")) ? 'icon-color-selected' : 'icon-color'}`}
        >
          <circle cx="5.5" cy="7.5" r="2.5"/>
          <rect x="2" y="10" width="7" height="6" rx="1"/>
          
          <circle cx="12" cy="6.5" r="3"/>
          <rect x="8" y="10" width="8" height="8" rx="1"/>

          <circle cx="18.5" cy="7.5" r="2.5"/>
          <rect x="16" y="10" width="7" height="6" rx="1"/>
        </svg>
      </button>
    </div>
  );
};

export default MobileNavBar;
