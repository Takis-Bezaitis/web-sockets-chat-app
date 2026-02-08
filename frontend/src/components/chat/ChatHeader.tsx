import ThemeToggle from "../ThemeToggle";
import { type RoomWithMembershipDTO, type User } from "../../types/custom";

type ChatHeaderProps = {
  user: User | null;
  currentRoom: RoomWithMembershipDTO;
  showMembers: boolean;
  setShowMembers: (m:boolean) => void;
};

const ChatHeader = ({user, currentRoom, showMembers, setShowMembers}: ChatHeaderProps) => {
 
  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_BACKEND_AUTH_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    window.location.reload();
  };

  return (
    <div className="bg-component-background text-foreground text-xl h-14 flex items-center 
    p-1.5 justify-between border-b border-border-line">
      <div className="bg-component-background text-foreground h-14 flex items-center border-b border-border-line">
        <div className="flex ml-4 gap-2 place-items-center">
          <div className="text-3xl">👤</div>
          <div className="text-xl">{user?.username}</div>
        </div>
      </div>

      <div># {currentRoom.name}</div>
      <div className="flex gap-2">
        <div className={`hidden md:block cursor-pointer hover:opacity-70`} 
            onClick={() => setShowMembers(!showMembers)}>
              👥
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="ml-3 mr-3 text-lg hover:text-red-500 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default ChatHeader;