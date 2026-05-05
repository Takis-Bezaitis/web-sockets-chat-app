import { useState } from "react";
import { useSocketStore } from "../../store/socketStore";
import { useMessageStore } from "../../store/messageStore";
import { type Message, type User } from "../../types/custom";
import { formatDate } from "../../utils/formatDate";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";

type Props = {
  message: Message;
  user: User | null;
  depth?: number;
};

const MessageItem = ({ message, user, depth = 0 }: Props) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const socket = useSocketStore.getState().socket;
  const setReplyingTo = useMessageStore((s) => s.setReplyingTo);
  
  const submitEdit = (messageId: number, roomId: number) => {
    if (!socket) return;

    if (!editingText.trim() || editingText === message.text) {
      cancelEdit();
      return;
    }

    socket.emit("message:edit", {
      id: messageId,
      roomId,
      text: editingText,
    });

    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  return (
    <div className={`ml-${depth * 6}`} key={message.id}>
      <div
        id={`message-${message.id}`}
        className={`relative flex gap-2 max-w-fit text-left 
          ${message.replyToId ? 'mt-3' : 'mt-6'}
          ${message.replies && message?.replies.length > 0 ? 'mb-6' : 'mb-11'}  
          px-3 py-2 rounded cursor-pointer ${
          message.userId === user?.id
            ? "bg-message-user"
            : "bg-message-other-user"
        }`}
        onMouseEnter={() => setHoveredMessageId(message.id)}
        onMouseLeave={() => setHoveredMessageId(null)}
      >
        {hoveredMessageId === message.id && (
          <MessageActions
            userId={user?.id}
            message={message}
            onEdit={(m) => {
              setEditingMessageId(m.id);
              setEditingText(m.text);
            }}
          />
        )}

        <div className="text-3xl">👤</div>

        <div>
          <span className="font-semibold">
            {message.userId === user?.id ? "You" : message.username}
          </span>{" "}
          {formatDate(message.createdAt)}

          {editingMessageId === message.id ? (
            <input
              className="w-full bg-transparent outline-none border-b"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEdit(message.id, message.roomId);
                if (e.key === "Escape") cancelEdit();
              }}
              autoFocus
            />
          ) : (
            <div>{message.text}</div>
          )}
        </div>

        {message.reactions.length > 0 && (
          <MessageReactions reactions={message.reactions ?? []} />
        )}

        <div 
          className="absolute right-1 bottom-[-19px] text-sm text-foreground hover:opacity-80 cursor-pointer"
          onClick={() => {
              if (!message.roomId) return;
              setReplyingTo(message.roomId, message);
          }}
        >
          Reply
        </div>
      </div>
      
      {message.replies?.map((reply) => (
        <div key={reply.id} className="ml-6">
          {reply.replyTo && (
            <div className="text-sm text-foreground mb-1">
              replying to {reply.replyTo.username}: {reply.replyTo.text}
            </div>
          )}
          <MessageItem message={reply} user={user} depth={depth + 1} />
        </div>
      ))}    

    </div>
  );
};

export default MessageItem;