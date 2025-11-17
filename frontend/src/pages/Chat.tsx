import { useState, useEffect, useMemo } from "react";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import { type User, type RoomUsers, type RoomWithMembershipDTO } from "../types/custom";
import AvailableRooms from "../components/AvailableRooms";
import UsersInRoom from "../components/UsersInRoom";
import Messages from "../components/Messages";
import MessageBox from "../components/MessageBox";

const Chat = () => {
  const { user } = useAuthStore();
  const { socket, connect, disconnect, sendMessage, addMessages, clearMessages, fetchedAll, setFetchedAll } = useSocketStore();
  const [ rooms, setRooms ] = useState<RoomWithMembershipDTO[]>([]);
  const [ currentRoom, setCurrentRoom ] = useState<RoomWithMembershipDTO>();
  const [ currentRoomUsers, setCurrentRoomUsers ] = useState<RoomUsers[]>([]);
  const [ typingUser, setTypingUser ] = useState<string | null>(null);
  const [ joinedUser, setJoinedUser ] = useState<User| null>(null);
  const [ leftUser, setLeftUser ] = useState<User| null>(null);

  const messages = useSocketStore(state => state.messages);
  const roomMessages = useMemo(() => {
    return messages.filter((msg) => msg.roomId === currentRoom?.id);
  }, [messages, currentRoom]);

  const [input, setInput] = useState("");

  useEffect(() => {
    // Fetch ALL messages once on mount
    const fetchAllMessages = async () => {
      if (fetchedAll) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_MESSAGES_BASE_URL}/all-messages`, 
          { credentials: "include", });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to fetch messages.");
        }

        const allMessages = await response.json();

        clearMessages(); // optional — ensures store starts clean
        addMessages(allMessages.data); // add all messages to the store
        setFetchedAll(true);

        console.log("✅ Loaded all messages:", allMessages.data.length);
      } catch (error) {
        console.error("Error fetching all messages:", error);
      }
    };

    fetchAllMessages();
  }, []);

  const getRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${user?.id}/rooms`);
      const roomsData = await response.json();
      setRooms(roomsData.data);
      return roomsData.data;
    } catch (error) {
      console.log(error);
    }
  };

  const getRoomUsers = async() => {
    if (!currentRoom?.id) return;

    try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${currentRoom.id}/room-users`
        );
        
        if (!response.ok) throw new Error("Failed to fetch room users");

        const roomUsers = await response.json();
        setCurrentRoomUsers(roomUsers.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getRooms();
  }, [])

  useEffect(() => {
    if (rooms.length > 0 && !currentRoom) {
      const generalRoom = rooms.find((r) => r.name === "general");
      if (generalRoom) setCurrentRoom(generalRoom);
    }
  }, [rooms, currentRoom]);

  useEffect(() => {
    getRoomUsers();
  }, [currentRoom]);

  // Connect socket on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!socket || !currentRoom?.id) return;

    socket.emit("joinRoom", currentRoom.id.toString());

    const handleUserTyping = (data: {user: string, roomId: string}) => {
      if (data.roomId === currentRoom.id.toString()) {
          setTypingUser(data.user);
          setTimeout(() => setTypingUser(null), 1000);
      }
    }

    socket.on("userTyping", handleUserTyping);

    return () => {
      socket.off("userTyping", handleUserTyping);
    };
  }, [socket, currentRoom]);


  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ user, roomId }: { user: User, roomId: string }) => {
      if (currentRoom?.id.toString() === roomId) { 
        getRoomUsers();
        setJoinedUser((prev) => {
          if (prev?.id !== user.id) return user;
          return prev; // no update if same user is already shown
        });
        setTimeout(() => setJoinedUser(null), 3000);
      }
    };

    const handleUserLeft = ({ user, roomId }: { user: User, roomId: string }) => {
      if (currentRoom?.id.toString() === roomId) {
        getRoomUsers();
        setLeftUser((prev) => {
          if (prev?.id !== user.id) return user;
          return prev;
        });
        setTimeout(() => setLeftUser(null), 3000);
      }
    };

    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);

    return () => {
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
    };
  }, [socket, currentRoom]);

  const handleSend = async () => {
    if (!input.trim() || !user || !currentRoom) return;

    sendMessage(currentRoom.id.toString(), input.trim());
    setInput("");
  };

  const onSelectRoom = (room: RoomWithMembershipDTO) => {
    setCurrentRoom(room)
  };

  const handleJoinLeaveRoom = async (room: RoomWithMembershipDTO, action: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${room.id}/${action}`,
        { 
          method: 'POST', 
          credentials: "include"
        }
      );
          
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to join/leave room");
      }
      
      // Refresh local state first (get latest from backend)
      const [ , updatedRooms ] = await Promise.all([getRoomUsers(), getRooms()]);

      // Update currentRoom with new isMember
      const updatedCurrentRoom = updatedRooms.find((r: { id: number; }) => r.id === room.id);
      if (updatedCurrentRoom) setCurrentRoom(updatedCurrentRoom);

      // Then notify other clients in real time
      if (socket) {
        socket.emit(action === "join" ? "joinRoom" : "leaveRoom", room.id.toString());
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div id="chat" className="flex flex-1 h-full">
      <AvailableRooms rooms={rooms} currentRoom={currentRoom} onSelectRoom={onSelectRoom} handleJoinLeaveRoom={handleJoinLeaveRoom} />
      <div id="messages-area" className="flex flex-col flex-1 bg-background overflow-hidden px-3 sm:px-6 md:px-10 lg:px-15 xl:px-20 2xl:px-35">
        <Messages user={user} messages={roomMessages} currentRoom={currentRoom}/>
        {typingUser && (
          <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
            <span className="animate-pulse">💬 {typingUser} is typing...</span>
          </div>
        )}
        {joinedUser && (
          <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
            <span>👥 {joinedUser.email} has joined the room.</span>
          </div>
        )}
        {leftUser && (
          <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
            <span>🚪 {leftUser.email} has left the room.</span>
          </div>
        )}
        <MessageBox handleSend={handleSend} input={input} setInput={setInput} currentRoom={currentRoom}/>
      </div>      
      <UsersInRoom currentRoomUsers={currentRoomUsers} />
    </div>
  );
};

export default Chat;
