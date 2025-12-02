import { useEffect, useRef, useState } from "react";
import { type User, type Message, type RoomDTO } from "../types/custom";
import { formatDate } from "../utils/formatDate";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";

type UserProps = {
    user: User | null;
    messages: Message[];
    currentRoom: RoomDTO | undefined;
}

const Messages = ({user, messages }: UserProps) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="p-4 space-y-2">
      {messages.map((msg, index) => (
        <div
          key={msg.id || index}
          className={`relative flex gap-2 max-w-sm text-left mb-9 p-2 rounded text-foreground cursor-pointer ${
            msg.userId === user?.id ? "ml-auto bg-message-user self-end" : "bg-message-other-user"
          }`}
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {hoveredMessageId === msg.id && <MessageActions userId={user?.id} message={msg} />}
          <div className="text-3xl">👤</div>
          <div>
            <span className="font-semibold">{msg.userId === user?.id ? "You" : msg.username}:</span>{" "}
            {formatDate(msg.createdAt)}
            <div>{msg.text}</div>
          </div>
          <MessageReactions reactions={msg.reactions ?? []}/>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default Messages;