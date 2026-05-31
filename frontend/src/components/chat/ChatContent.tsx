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

  onRegisterScroll: (fn: (id: number) => void) => void;

  videoAndChat?: boolean;
};

const ChatContent = ({currentRoom, 
    user, roomMessages, loading,
    typingUserByRoom, 
    handleSend, input, setInput, handleJoinLeaveRoom, onRegisterScroll, videoAndChat}: ChatContentProps) => {
  
  return (
    <>
      <div id="messages-area" className={`relative flex flex-col flex-1 min-h-0 
      ${videoAndChat ? 'bg-component-background' : 'bg-background'} overflow-hidden px-2`}>
        <div className="flex-1 flex flex-col min-h-0">
            <Messages user={user} messages={roomMessages} currentRoom={currentRoom} 
            loading={loading} onRegisterScroll={onRegisterScroll} />
        </div>
        {currentRoom && typingUserByRoom[currentRoom.id] && (
          <div 
            className="
              absolute 
              flex 
              items-center
              bottom-0
              rounded
              border
              border-border-line
              z-75 
              mb-23 
              text-sm 
              bg-background 
              text-foreground 
              italic 
              p-2 
              gap-2"
            >
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