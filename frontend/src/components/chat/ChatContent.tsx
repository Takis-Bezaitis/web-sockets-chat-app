import type { Message, RoomWithMembershipDTO, User } from "../../types/custom";
import ChatHeader from "./ChatHeader";
import MessageBox from "../messages/MessageBox";
import Messages from "../messages/Messages"

type ChatContentProps = {
  currentRoom: RoomWithMembershipDTO | undefined;

  showMembers: boolean;
  setShowMembers: React.Dispatch<React.SetStateAction<boolean>>;

  user: User | null;
  roomMessages: Message[];
  loading: boolean;

  typingUserByRoom: Record<number, string | null>;

  handleSend: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
};

const ChatContent = ({currentRoom, showMembers, setShowMembers, 
    user, roomMessages, loading,
    typingUserByRoom, 
    handleSend, input, setInput}: ChatContentProps) => {
  return (
    <>
      {currentRoom && <ChatHeader currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}/>}
      <div id="messages-area" className="flex flex-col flex-1 bg-background overflow-hidden px-3 pb-10 
      sm:px-6 md:px-10 lg:pb-0">
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          <Messages user={user} messages={roomMessages} currentRoom={currentRoom} loading={loading} />
      </div>
      {currentRoom && typingUserByRoom[currentRoom.id] && (
          <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
          <span className="animate-pulse">💬 {typingUserByRoom[currentRoom.id]} is typing...</span>
          </div>
      )}
      <MessageBox handleSend={handleSend} input={input} setInput={setInput} currentRoom={currentRoom} />
      </div>
    </>
  )
}

export default ChatContent;