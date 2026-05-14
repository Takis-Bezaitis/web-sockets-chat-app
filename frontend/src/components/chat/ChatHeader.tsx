import ThemeToggle from "../common/ThemeToggle";
import { type RoomWithMembershipDTO, type User, type Message } from "../../types/custom";
import MessageSearch from "../messages/MessageSearch";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { LogOut } from 'lucide-react';
import { API } from "../../api/api";
import { useAuthStore } from "../../store/authStore";

type ChatHeaderProps = {
  user: User | null;
  mobileView: "chat" | "rooms" | "members" | "video";
  currentRoom: RoomWithMembershipDTO;
  roomMessages: Message[];
  loading: boolean;
  showMembers: boolean;
  setShowMembers: (m:boolean) => void;
  onScrollToMessage: (id: number) => void;
};

const ChatHeader = ({user, mobileView, currentRoom, roomMessages, loading, showMembers, setShowMembers, onScrollToMessage}: ChatHeaderProps) => {
  const isSmall = useMediaQuery("(max-width: 768px)");
  const token = useAuthStore.getState().token;
  
  const handleLogout = async () => {
    await fetch(API.auth.logout, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    window.location.reload();
  };
  let myChat = document.getElementById("root")?.clientHeight;
  return (
    <div className={`shrink-0 bg-component-background text-foreground ${isSmall ? 'text-base' : 'text-xl'} h-14 flex items-center 
    p-1.5 justify-between border-b border-border-line`}>
      <div className="flex place-content-between  gap-2 bg-component-background text-foreground h-14 items-center border-b border-border-line">
        <div className={`flex gap-2 place-items-center overflow-hidden ${isSmall ? 'ml-1' : 'ml-4'}`}>
          <div className={`${isSmall ? 'text-2xl' : 'text-3xl'}`}>👤</div>
          <div className={`truncate ${isSmall ? 'text-base mr-1 max-w-16' : 'text-xl max-w-40'}`}>{user?.username}</div>
        </div>
      </div>

      <div className={`relative overflow-hidden mx-5 ${isSmall && 'max-w-28'}`}>
          <p className="truncate"># {currentRoom.name} {myChat}</p>
      </div>

      <div className={`flex gap-2 items-center ${isSmall && 'ml-2'}`}>
        {((isSmall && mobileView === "chat") || !isSmall) &&
          <MessageSearch 
            user={user} 
            messages={roomMessages} 
            loading={loading} 
            onScrollToMessage={onScrollToMessage} 
          />
        }

        <div className={`hidden md:block cursor-pointer hover:opacity-70`} 
            onClick={() => setShowMembers(!showMembers)}>
              👥
        </div>

        <ThemeToggle />
        
        <button
          onClick={handleLogout}
          className={`shrink-0 flex items-center justify-center hover:opacity-70 hover:text-red-500 cursor-pointer ${isSmall ? 'mx-0.5 w-8 h-8' : 'mx-3 w-9 h-9'}`}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader;