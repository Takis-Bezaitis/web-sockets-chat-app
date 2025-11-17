import { useEffect, useRef } from "react";
import { type User, type Message, type RoomDTO } from "../types/custom";

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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`p-2 rounded ${
                msg.userId === user?.id ? "bg-blue-200 self-end" : "bg-gray-300"
              }`}
            > 
              <span className="font-semibold">{msg.userId === user?.id ? "You" : msg.email}:</span>{" "}
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
    </div>
  )
}

export default Messages