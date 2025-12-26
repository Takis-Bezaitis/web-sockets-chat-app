import ThemeToggle from "../ThemeToggle";
import { type RoomWithMembershipDTO } from "../../types/custom";
import { useWebRTCStore } from "../../store/webrtcStore";

type ChatHeaderProps = {
    currentRoom: RoomWithMembershipDTO;
    showMembers: boolean;
    setShowMembers: (m:boolean) => void;
};

const ChatHeader = ({currentRoom, showMembers, setShowMembers}: ChatHeaderProps) => {
  const callState = useWebRTCStore((state) => state.callState);
  const isCaller = useWebRTCStore((state) => state.isCaller);

  return (
    <div className="bg-component-background text-foreground text-xl h-14 flex items-baseline 
    p-1.5 justify-between border-b border-border-line">
        <div># {currentRoom.name}</div>
        <div className="flex items-baseline">
          <div className={`hidden lg:block hover:text-primary cursor-pointer 
            ${((callState!=='idle' && isCaller) || (callState==='inCall' && !isCaller)) ? 'xl:block' : 'xl:hidden'}`} 
              onClick={() => setShowMembers(!showMembers)}>
                👥
          </div>
          <ThemeToggle />
        </div>
    </div>
  )
}

export default ChatHeader;