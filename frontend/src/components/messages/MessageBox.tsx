import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useSocketStore } from "../../store/socketStore";
import { type RoomWithMembershipDTO } from "../../types/custom";
import { useMessageStore } from "../../store/messageStore";
import { CircleX, SendHorizontal } from 'lucide-react';
import { MESSAGE_MAX_LENGTH, REPLYING_TO_TEXT_LIMIT, MAX_AREA_TEXT_HEIGHT } from "../../constants/message";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import EmojiPicker from "./EmojiPicker";

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
  const roomId = currentRoom?.id;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const didMountRef = useRef(false);

  const [showInput, setShowInput] = useState(currentRoom?.isMember ?? false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const canSend = currentRoom?.isMember && input.length > 0 && input.length <= MESSAGE_MAX_LENGTH;
  const tooLong = input.length > MESSAGE_MAX_LENGTH;
  const remainingChars = Math.max(MESSAGE_MAX_LENGTH - [...input].length, 0);

  const isSmall = useMediaQuery("(max-width: 768px)");

  const handleTyping = () => {
    if (!socket || !user || !roomId) return;
    socket.emit("typing", { user: user.email, roomId: currentRoom.id.toString() });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setDraft(currentRoom.id, value);
    handleTyping();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, MAX_AREA_TEXT_HEIGHT) + "px";
    }
  };

  const handleOptimisticJoin = () => {
    setShowInput(true);
    handleJoinLeaveRoom(currentRoom, "join");
  };

  const handleTextareaSend = () => {
    handleSend();

    setDraft(currentRoom.id, "");
    setIsEmojiPickerOpen(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const updateMessage = (emoji: string) => {
    const newValue = input + emoji;
    handleInputChange(newValue);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    setInput(draft);
    setIsEmojiPickerOpen(false);
  }, [currentRoom.id]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (showInput && textareaRef.current && !isSmall) {
      textareaRef.current.focus();
    }
  }, [roomId, showInput, replyingTo, isSmall]);

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
                  <span>{replyingTo.text.length > REPLYING_TO_TEXT_LIMIT
                    ? replyingTo.text.slice(0, REPLYING_TO_TEXT_LIMIT) + "…"
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

            {isEmojiPickerOpen && 
              <div className="absolute bottom-full right-4 mb-1 z-70">
                <EmojiPicker textSelect={updateMessage} />
              </div>
            }

            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 w-full">
              <textarea
                ref={textareaRef}
                value={input}
                maxLength={MESSAGE_MAX_LENGTH}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTextareaSend();
                  }
                }}
                placeholder={`Message #${currentRoom?.name}`}
                className="w-full border border-border-line resize-none rounded-lg p-2 
                  text-foreground placeholder-gray-500 bg-component-background focus:outline-none no-scrollbar"
                rows={1}
              />
              <div 
                className="cursor-pointer"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >😀</div>
              <p className={`text-sm mr-2 
                ${remainingChars < 11 ? 'text-red-700' : 'text-foreground'}`}
              >
                {remainingChars}
              </p>
              
              <button
                onClick={handleTextareaSend}
                disabled={!canSend || tooLong}
                className={`
                  ${isSmall 
                    ? `text-foreground flex items-center justify-center ${canSend ? 'opacity-100' : 'opacity-70'}`
                    : `h-9 bg-button-main text-button px-4 rounded ${canSend && 'hover:bg-button-hover'}`
                  }
                  ${canSend 
                    ? 'cursor-pointer'
                    : 'cursor-default'
                  }
                `}
              >
                {isSmall ? <SendHorizontal /> : 'Send'}
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