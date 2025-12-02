import ThemeToggle from "./ThemeToggle";
import { type RoomWithMembershipDTO } from "../types/custom";

type ChatHeaderProps = {
    currentRoom: RoomWithMembershipDTO
};

const ChatHeader = ({currentRoom}: ChatHeaderProps) => {
  return (
    <div className="bg-component-background text-foreground text-lg h-14 flex items-center p-1.5 justify-between">
        <div># {currentRoom.name}</div>
        <ThemeToggle />
    </div>
  )
}

export default ChatHeader