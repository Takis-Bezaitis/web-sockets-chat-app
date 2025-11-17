import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { type RoomWithMembershipDTO } from "../types/custom";

type MessageBoxProps = {
    handleSend: () => void;
    input: string;
    setInput: (e: any) => void;
    currentRoom?: RoomWithMembershipDTO | null;
}

const MessageBox = ({handleSend, input, setInput, currentRoom}: MessageBoxProps) => {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  const handleTyping = () => {
    if (!socket || !user || !currentRoom?.id) return;
      socket.emit("typing", { user: user.email, roomId: currentRoom.id.toString() });
  };

  return (
    <div className="p-4 bg-white flex-shrink-0 flex">
        <input
            type="text"
            className="flex-1 border p-2 rounded mr-2"
            value={input}
            disabled={!currentRoom?.isMember}
            onChange={(e) => { 
              setInput(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
        />
        <button
            onClick={handleSend}
            disabled={!currentRoom?.isMember}
            className={`text-white px-4 rounded  
              ${currentRoom?.isMember ? 'cursor-pointer bg-blue-500 hover:bg-blue-600' : 'cursor-default bg-gray-500' }`}
        >
        Send
        </button>
    </div>
  )
}

export default MessageBox;