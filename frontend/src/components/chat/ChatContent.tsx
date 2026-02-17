import { memo } from 'react';
import type { Message, RoomWithMembershipDTO, User } from "../../types/custom";
import MessageBox from "../messages/MessageBox";
import Messages from "../messages/Messages"

type ChatContentProps = {
  currentRoom: RoomWithMembershipDTO | undefined;

  user: User | null;
  roomMessages: Message[];
  loading: boolean;

  typingUserByRoom: Record<number, string | null>;

  handleSend: () => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleJoinLeaveRoom: (room: RoomWithMembershipDTO, action: "join" | "leave") => void;

  videoAndChat?: boolean;
};

const ChatContent = ({currentRoom, 
    user, roomMessages, loading,
    typingUserByRoom, 
    handleSend, input, setInput, handleJoinLeaveRoom, videoAndChat}: ChatContentProps) => {
  
  return (
    <>
      <div id="messages-area" className={`flex flex-col flex-1 min-h-0 
      ${videoAndChat ? 'bg-component-background' : 'bg-background'} overflow-hidden px-2 pb-10 md:pb-0`}>
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
            <Messages user={user} messages={roomMessages} currentRoom={currentRoom} loading={loading} />
        </div>
        {currentRoom && typingUserByRoom[currentRoom.id] && (
            <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
            <span className="animate-pulse">💬 {typingUserByRoom[currentRoom.id]} is typing...</span>
            </div>
        )}
        <MessageBox 
          handleSend={handleSend} 
          input={input} 
          setInput={setInput} 
          currentRoom={currentRoom}
          handleJoinLeaveRoom={handleJoinLeaveRoom} 
        />
      </div>
    </>
  )
}

export default memo(ChatContent);