import { useEffect, useRef } from "react";
import { type User, type Message, type RoomDTO } from "../types/custom";
import { formatDate } from "../utils/formatDate";

type UserProps = {
    user: User | null;
    messages: Message[];
    currentRoom: RoomDTO | undefined;
}

const Messages = ({user, messages, currentRoom}: UserProps) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
        <header className="bg-blue-500 text-white p-4">
          Connected as: {user?.email} {currentRoom?.name}
        </header>
        <div className="overflow-y-auto p-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`max-w-sm text-center mb-5 p-2 rounded text-foreground ${
                msg.userId === user?.id ? "ml-auto bg-message-user self-end" : "bg-message-other-user"
              }`}
            > 
              <span className="font-semibold">{msg.userId === user?.id ? "You" : msg.email}:</span>{" "}
              {msg.text}
              <div>{formatDate(msg.createdAt)}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
    </div>
  )
}

export default Messages