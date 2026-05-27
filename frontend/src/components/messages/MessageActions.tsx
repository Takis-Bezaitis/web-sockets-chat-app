import { type Message } from "../../types/custom";
import { useSocketStore } from "../../store/socketStore";

type MessageActionsProps = {
    userId: number | undefined;
    message: Message;
    onEdit: (e: React.MouseEvent, msg: Message) => void;
};

const MessageActions = ({userId, message, onEdit}: MessageActionsProps) => {
  const socket = useSocketStore.getState().socket;

  const handleReactionClick = (emoji: string) => {
    if (!socket) return;

    socket.emit("message:react", {
      emoji,
      userId,
      messageId: message.id,
    });
  };

  const handleDeleteMessage = (id: number, roomId: number) => {
    if (!socket) return;

    socket.emit("message:delete", { id, roomId });
  };

  return (
    <div 
      className="absolute flex gap-1 top-0 right-0 -translate-y-6 secondary-border-line 
      border-1 bg-background p-0.5 rounded-[7px] shadow cursor-pointer">
        <div onClick={(e) => {
          e.stopPropagation();
          handleReactionClick("👍");
        }}>
          👍
        </div>

        <div onClick={(e) => {
          e.stopPropagation();
          handleReactionClick("❤️")
        }}>
          ❤️
        </div>

        <div onClick={(e) => { 
          e.stopPropagation();
          handleReactionClick("😄")
        }}>
          😄
        </div>

        {userId === message.userId && (
          <div className="flex gap-1">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e, message);
                }}
              >
                ✏️
              </div>
              
              <div onClick={(e) => {
                e.stopPropagation();
                handleDeleteMessage(message.id, message.roomId)
              }}>
                🗑
              </div>
          </div>
        )}
    </div>
  );
};

export default MessageActions;