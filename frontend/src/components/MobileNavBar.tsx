interface MobileNavBarProps {
  mobileView: "chat" | "rooms" | "members";
  setMobileView: (v: "chat" | "rooms" | "members") => void;
}

export default function MobileNavBar({ mobileView, setMobileView }: MobileNavBarProps) {
  return (
    <div className="flex justify-center bg-component-background p-2 gap-10 text-xl border-t border-border-line">
      <button
        onClick={() => setMobileView("chat")}
        className={`cursor-pointer ${mobileView === "chat" ? "font-bold" : ""}`}
      >
        💬 Chat
      </button>

      <button
        onClick={() => setMobileView("rooms")}
        className={`cursor-pointer ${mobileView === "rooms" ? "font-bold" : ""}`}
      >
        📂 Rooms
      </button>

      <button
        onClick={() => setMobileView("members")}
        className={`cursor-pointer ${mobileView === "members" ? "font-bold" : ""}`}
      >
        👥 Members
      </button>
    </div>
  );
}
