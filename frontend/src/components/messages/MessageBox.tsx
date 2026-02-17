import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useSocketStore } from "../../store/socketStore";
import { type RoomWithMembershipDTO } from "../../types/custom";
import InputEmoji from 'react-input-emoji';
import { useMessageStore } from "../../store/messageStore";

type MessageBoxProps = {
    handleSend: () => void;
    input: string;
    setInput: (e: any) => void;
    currentRoom?: RoomWithMembershipDTO | null;
    handleJoinLeaveRoom: (
      room: RoomWithMembershipDTO,
      action: "join" | "leave"
    ) => void;
}

const MessageBox = ({handleSend, input, setInput, currentRoom, handleJoinLeaveRoom}: MessageBoxProps) => {
  if (!currentRoom) return;
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { getDraftForRoom, setDraftForRoom } = useMessageStore();

  const [showInput, setShowInput] = useState(currentRoom?.isMember ?? false);
  const roomId = currentRoom?.id;
  const inputRef = useRef<any>(null);

  const handleTyping = () => {
    if (!socket || !user || !roomId) return;
    socket.emit("typing", { user: user.email, roomId: currentRoom.id.toString() });
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setDraftForRoom(currentRoom.id, value);
    handleTyping();
  };

  const handleOptimisticJoin = () => {
    setShowInput(true);
    handleJoinLeaveRoom(currentRoom, "join");
  };

  useEffect(() => {
    const roomDraft = getDraftForRoom(currentRoom.id);
    setInput(roomDraft);
  }, [currentRoom.id]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [roomId, showInput]);

  useEffect(() => {
    setShowInput(currentRoom?.isMember ?? false);
  }, [currentRoom?.isMember]);

  return (
    <div className="h-[80px] px-4 py-2 mb-2 rounded-lg border border-border-line bg-component-background flex-shrink-0 flex items-center justify-center">
        {showInput ? 
          <>
          <div className="relative flex-1">
          {input.length === 0 && (
              <span className="absolute left-[24px] top-3 pointer-events-none z-1 text-foreground">
                Message #{currentRoom?.name}
              </span>
            )}
            <InputEmoji 
              ref={inputRef}
              key={roomId}
              value={input}
              onChange={handleInputChange}
              maxLength={150}
              cleanOnEnter
              onEnter={handleSend}
              placeholder="" shouldReturn={false} shouldConvertEmojiToImage={false}
            />
          </div>
          <button
              onClick={handleSend}
              disabled={!currentRoom?.isMember}
              className={`h-9 bg-button-main hover:bg-button-hover text-button px-4 rounded  
                ${currentRoom?.isMember ? 'cursor-pointer' : 'cursor-default' }`}
          >
          Send
          </button>
          </> : 
          <div className="px-4 py-3 flex w-full items-center justify-center gap-2 text-foreground">
            <p>You’re not a member of this channel yet. Join the channel to view and send messages.</p>
            <button
              title="Join channel"
              className="cursor-pointer"
              onClick={handleOptimisticJoin}
            >
              👤+
            </button>
          </div>
        }
    </div>
  )
}

export default MessageBox;