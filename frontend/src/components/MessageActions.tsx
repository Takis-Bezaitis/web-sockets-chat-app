import { type Message } from "../types/custom";
import { useSocketStore } from "../store/socketStore";

type MessageActionsProps = {
    userId: number | undefined;
    message: Message;
};

const MessageActions = ({userId, message}: MessageActionsProps) => {

  const handleReactionClick = (emoji: string) => {
    const socket = useSocketStore.getState().socket;

    if (!socket) return;

    socket.emit("message:react", {
      emoji,
      userId,
      messageId: message.id,
    });
  };

  return (
    <div className="absolute flex gap-1 top-0 right-0">
        <div onClick={() => handleReactionClick("👍")}>👍</div>
        <div onClick={() => handleReactionClick("❤️")}>❤️</div>
        <div onClick={() => handleReactionClick("😄")}>😄</div>

        {userId === message.userId && (
          <div className="flex gap-1">
              <div>✏️</div>
              <div>🗑</div>
          </div>
        )}
    </div>
  );
};

export default MessageActions;