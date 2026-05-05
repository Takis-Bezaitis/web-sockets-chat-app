import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useSocketStore } from "../../store/socketStore";
import { type RoomWithMembershipDTO } from "../../types/custom";
import InputEmoji from 'react-input-emoji';
import { useMessageStore } from "../../store/messageStore";
import { CircleX } from 'lucide-react';
import { MESSAGE_MAX_LENGTH } from "../../constants/message";

type MessageBoxProps = {
    handleSend: () => void;
    input: string;
    setInput: (e: string) => void;
    currentRoom?: RoomWithMembershipDTO | null;
    handleJoinLeaveRoom: (
      room: RoomWithMembershipDTO,
      action: "join" | "leave"
    ) => void;
}

const MessageBox = ({handleSend, input, setInput, currentRoom, handleJoinLeaveRoom}: MessageBoxProps) => {
  if (!currentRoom) return null;

  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  
  const replyingTo = useMessageStore(s => s.replyingToByRoom[currentRoom.id]);
  const draft = useMessageStore(s => s.draftByRoom[currentRoom.id] ?? "");
  const setDraft = useMessageStore(s => s.setDraftForRoom);
  const setReplyingTo = useMessageStore(s => s.setReplyingTo);

  const [showInput, setShowInput] = useState(currentRoom?.isMember ?? false);
  const roomId = currentRoom?.id;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSend = currentRoom?.isMember && input.length > 0 && input.length <= MESSAGE_MAX_LENGTH;
  const tooLong = input.length > MESSAGE_MAX_LENGTH;
  const remainingChars = Math.max(MESSAGE_MAX_LENGTH - [...input].length, 0);

  const handleTyping = () => {
    if (!socket || !user || !roomId) return;
    socket.emit("typing", { user: user.email, roomId: currentRoom.id.toString() });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setDraft(currentRoom.id, value);
    handleTyping();
  };

  const handleOptimisticJoin = () => {
    setShowInput(true);
    handleJoinLeaveRoom(currentRoom, "join");
  };

  useEffect(() => {
    setInput(draft);
  }, [currentRoom.id]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [roomId, showInput, replyingTo]);

  useEffect(() => {
    setShowInput(currentRoom?.isMember ?? false);
  }, [currentRoom?.isMember]);

  return (
    <div className="relative min-h-[80px] px-4 py-2 mb-2 rounded-lg border border-border-line bg-component-background flex-shrink-0 flex items-center justify-center">
        {showInput || (currentRoom.creatorId === user?.id) ? (
          <>

            {replyingTo && input.length <= MESSAGE_MAX_LENGTH && (
              <div 
                className="absolute bottom-full left-0 p-2 rounded-lg border border-border-line 
                text-sm text-foreground bg-background flex justify-between items-center"
              >

                <div className="flex items-center gap-1 flex-wrap">
                  <span>Replying to</span>
                  <strong>{replyingTo.username}:</strong>
                  <span>{replyingTo.text.length > 100
                    ? replyingTo.text.slice(0, 100) + "…"
                    : replyingTo.text}
                  </span>
                </div>

                <button
                  onClick={() => setReplyingTo(currentRoom.id, null)}
                  className="ml-2 hover:text-red-500 cursor-pointer"
                >
                  <CircleX />
                </button>
                
              </div>
            )}

            {input.length > MESSAGE_MAX_LENGTH && (
              <div className="absolute bottom-full left-0 p-3.5 rounded-lg border border-border-line 
                text-sm text-foreground bg-background text-center">{`This message exceeds ${MESSAGE_MAX_LENGTH} characters.`}</div>
            )}

            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 w-full">
              <div className={`emoji-wrapper ${input.length === 0 ? "empty" : "has-text"}`}>
                <InputEmoji 
                  ref={inputRef}
                  key={roomId}
                  value={input}
                  onChange={handleInputChange}
                  maxLength={MESSAGE_MAX_LENGTH}
                  cleanOnEnter
                  onEnter={handleSend}
                  placeholder={`Message #${currentRoom?.name}`}
                  shouldReturn={false} 
                  shouldConvertEmojiToImage={false}
                />
              </div>
           

            <p className={`text-sm mr-2 
              ${remainingChars < 11 ? 'text-red-700' : 'text-foreground'}`}
            >
              {remainingChars}
            </p>
            
            <button
                onClick={handleSend}
                disabled={!canSend || tooLong}
                className={`h-9 bg-button-main text-button px-4 rounded  
                  ${canSend 
                    ? 'cursor-pointer hover:bg-button-hover' : 'cursor-default' }`}
            >
            Send
            </button>
             </div>
          </> 
          ) : (
          <div className="px-4 py-3 flex w-full items-center justify-center gap-2 text-foreground">
            <p className="text-center text-balance">You’re not a member of this channel yet. Join the channel to view and send messages.</p>
            <button
              title="Join channel"
              className="cursor-pointer min-w-[45px]"
              onClick={handleOptimisticJoin}
            >
              👤+
            </button>
          </div>
        )}
    </div>
  )
}

export default MessageBox;