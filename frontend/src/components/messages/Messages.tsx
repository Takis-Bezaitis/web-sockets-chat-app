import { useEffect, useRef, useState } from "react";
import { useSocketStore } from "../../store/socketStore";
import { type User, type Message, type RoomDTO } from "../../types/custom";
import { formatDate } from "../../utils/formatDate";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import Spinner from "../Spinner";

type UserProps = {
    user: User | null;
    messages: Message[];
    currentRoom: RoomDTO | undefined;
    loading: boolean;
}

const Messages = ({user, messages, loading }: UserProps) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(scrollToBottom, [messages]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner />
      </div>
    );
  }

  const submitEdit = (messageId: number, roomId: number) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    if (editingText.trim() === "" || editingText === messages.find(m => m.id === messageId)?.text) {
        cancelEdit();
        return;
    }

    socket.emit("message:edit", {
      id: messageId,
      roomId,
      text: editingText
    })

    setEditingMessageId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-2">
      {messages.map((msg, index) => (
        <div
          key={msg.id || index}
          className={`relative flex gap-2 max-w-sm text-left mt-6 mb-11 p-2 rounded text-foreground cursor-pointer ${
            msg.userId === user?.id ? "ml-auto bg-message-user self-end" : "bg-message-other-user"
          }`}
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {hoveredMessageId === msg.id && 
            <MessageActions 
              userId={user?.id} 
              message={msg} 
              onEdit={(m) => {
                setEditingMessageId(m.id);
                setEditingText(m.text);
              }} 
            />}
          <div className="text-3xl">👤</div>
          <div>
            <span className="font-semibold">{msg.userId === user?.id ? "You" : msg.username}:</span>{" "}
            {formatDate(msg.createdAt)}
            {editingMessageId === msg.id ? (
              <input 
                className="w-full bg-transparent outline-none border-b" 
                value={editingText} 
                onChange={(e) => setEditingText(e.target.value)} 
                onKeyDown={(e) => { 
                  if (e.key === "Enter") submitEdit(msg.id, msg.roomId); 
                  if (e.key === "Escape") cancelEdit(); 
                }} 
                autoFocus 
              />
            ) : (
              <div>{msg.text}</div>
            )}
          </div>
          <MessageReactions reactions={msg.reactions ?? []}/>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default Messages;