import ThemeToggle from "../ThemeToggle";
import { type RoomWithMembershipDTO, type User, type Message } from "../../types/custom";
import MessageSearch from "../messages/MessageSearch";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { LogOut } from 'lucide-react';

type ChatHeaderProps = {
  user: User | null;
  currentRoom: RoomWithMembershipDTO;
  roomMessages: Message[];
  loading: boolean;
  showMembers: boolean;
  setShowMembers: (m:boolean) => void;
  onScrollToMessage: (id: number) => void;
};

const ChatHeader = ({user, currentRoom, roomMessages, loading, showMembers, setShowMembers, onScrollToMessage}: ChatHeaderProps) => {
  const isSmall = useMediaQuery("(max-width: 768px)");

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_BACKEND_AUTH_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });

    window.location.reload();
  };

  return (
    <div className={`bg-component-background text-foreground ${isSmall ? 'text-base' : 'text-xl'} h-14 flex items-center 
    p-1.5 justify-between border-b border-border-line`}>
      <div className="flex place-content-between  gap-2 bg-component-background text-foreground h-14 items-center border-b border-border-line">
        <div className={`flex gap-2 place-items-center overflow-hidden ${isSmall ? 'ml-1' : 'ml-4'}`}>
          <div className={`${isSmall ? 'text-2xl' : 'text-3xl'}`}>👤</div>
          <div className={`truncate ${isSmall ? 'text-base mr-1 max-w-16' : 'text-xl max-w-40'}`}>{user?.username}</div>
        </div>
      </div>

      <div className={`relative overflow-hidden mx-5 ${isSmall ? 'max-w-28' : ''}`}>
          <p className="truncate"># {currentRoom.name}</p>
      </div>

      <div className={`flex gap-2 ${isSmall ? 'ml-2' : ''}`}>
        <MessageSearch user={user} messages={roomMessages} loading={loading} onScrollToMessage={onScrollToMessage} />
        <div className={`hidden md:block cursor-pointer hover:opacity-70`} 
            onClick={() => setShowMembers(!showMembers)}>
              👥
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className={`text-lg hover:opacity-70 hover:text-red-500 cursor-pointer ${isSmall ? 'mx-0.5' : 'mx-3'}`}
        >
          <LogOut />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader;