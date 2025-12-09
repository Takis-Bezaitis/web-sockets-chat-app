import ThemeToggle from "./ThemeToggle";
import { type RoomWithMembershipDTO } from "../types/custom";

type ChatHeaderProps = {
    currentRoom: RoomWithMembershipDTO;
    showMembers: boolean;
    setShowMembers: (m:boolean) => void;
};

const ChatHeader = ({currentRoom, showMembers, setShowMembers}: ChatHeaderProps) => {
  return (
    <div className="bg-component-background text-foreground text-xl h-14 flex items-baseline 
    p-1.5 justify-between border-b border-border-line">
        <div># {currentRoom.name}</div>
        <div className="flex items-baseline">
          <div className="hidden lg:block xl:hidden hover:text-primary cursor-pointer" 
              onClick={() => setShowMembers(!showMembers)}>
                👥
          </div>
          <ThemeToggle />
        </div>
    </div>
  )
}

export default ChatHeader;