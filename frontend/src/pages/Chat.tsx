// frontend/src/pages/Chat.tsx
import { useEffect, useMemo, useState } from "react";
import { useSocketStore } from "../store/socketStore";
import { useAuthStore } from "../store/authStore";
import type { RoomWithMembershipDTO, RoomUsers } from "../types/custom";
import AvailableRooms from "../components/AvailableRooms";
import UsersInRoom from "../components/UsersInRoom";
import Messages from "../components/Messages";
import MessageBox from "../components/MessageBox";

const Chat = () => {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  // store API
  const {
    connect,
    disconnect,
    enterRoom,
    exitRoom,
    sendMessage,
    getMessagesForRoom,
    messagesByRoom,
    typingUserByRoom,
  } = useSocketStore();

  // local UI state
  const [rooms, setRooms] = useState<RoomWithMembershipDTO[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomWithMembershipDTO | undefined>(undefined);
  const [currentRoomUsers, setCurrentRoomUsers] = useState<RoomUsers[]>([]);
  const [input, setInput] = useState("");

  // messages for currently selected room (derived from store)
  const roomMessages = useMemo(() => {
    if (!currentRoom) return [];
    return getMessagesForRoom(currentRoom.id);
  }, [currentRoom, messagesByRoom, getMessagesForRoom]);

  // connect socket on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === helper: fetch rooms (single source of truth) ===
  const fetchRooms = async (): Promise<RoomWithMembershipDTO[]> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${user?.id}/rooms`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch rooms");
      }
      const json = await res.json();
      const data = json.data ?? json;
      setRooms(data);
      return data;
    } catch (err) {
      console.error("Failed to load rooms", err);
      return [];
    }
  };

  // fetch rooms once when user id is available
  useEffect(() => {
    if (!user?.id) return;
    void fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Automatically select "general" room once rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && !currentRoom) {
      const general = rooms.find((r) => r.name === "general");
      if (general) {
        setCurrentRoom(general);
        // fetch members and subscribe to messages (no need to await)
        void getRoomUsers(general.id);
        void enterRoom(general.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, currentRoom]);

  useEffect(() => {
    if (!socket || !currentRoom?.id) return;
  
    const handleMembershipJoined = ({ roomId }: { roomId: number }) => {
      if (Number(roomId) !== currentRoom.id) return;
      getRoomUsers(currentRoom.id);
    };

    const handleMembershipLeft = ({ roomId }: { roomId: number }) => {
      if (Number(roomId) !== currentRoom.id) return;
      getRoomUsers(currentRoom.id);
    };

    socket.on("membership:joined", handleMembershipJoined);
    socket.on("membership:left", handleMembershipLeft);

    return () => {
      socket.off("membership:joined", handleMembershipJoined);
      socket.off("membership:left", handleMembershipLeft);
    }
  },[socket, currentRoom]);

  // helper: fetch users in a room
  const getRoomUsers = async (roomId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${roomId}/room-users`,
        { credentials: "include" }
      );
      if (!response.ok) {
        // try to log helpful info
        const err = await response.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch room users");
      }
      const json = await response.json();
      setCurrentRoomUsers(json.data ?? json);
    } catch (err) {
      console.error("getRoomUsers failed:", err);
      setCurrentRoomUsers([]);
    }
  };

  // When user selects a room in the UI
  const onSelectRoom = async (room: RoomWithMembershipDTO) => {
    try {
      // exit previous room (socket subscription) if any
      if (currentRoom) {
        exitRoom(currentRoom.id);
      }

      setCurrentRoom(room);

      // store handles socket subscription + fetch (cache-backed)
      await enterRoom(room.id);

      // fetch the members for the newly selected room
      await getRoomUsers(room.id);
    } catch (err) {
      console.error("onSelectRoom error:", err);
    }
  };

  // Join / leave room membership via REST then emit membership event
  // AvailableRooms expects handleJoinLeaveRoom: (room, action: string) => void,
  // so we accept action: string and validate it here.
  const handleJoinLeaveRoom = async (room: RoomWithMembershipDTO, action: string) => {
    if (action !== "join" && action !== "leave") {
      console.warn("Unsupported action for join/leave:", action);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${room.id}/${action}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "unknown" }));
        throw new Error(err.error || "Failed to join/leave room");
      }

      // Refresh local state (members + rooms). Wait both so we can update UI consistently.
      const [ , updatedRooms ] = await Promise.all([getRoomUsers(room.id), fetchRooms()]);

      // Update currentRoom (update isMember or similar flag)
      const updatedCurrentRoom = updatedRooms.find((r: any) => r.id === room.id);
      if (updatedCurrentRoom) {
        setCurrentRoom(updatedCurrentRoom);
      }

      // Notify others via socket (membership event) if socket exists
      const sock = useSocketStore.getState().socket;
      if (sock) {
        sock.emit(action === "join" ? "joinRoom" : "leaveRoom", room.id.toString());
      }
    } catch (err) {
      console.error("handleJoinLeaveRoom error:", err);
    }
  };

  // handle sending using local input state (MessageBox expects handleSend(): void)
  const handleSend = () => {
    if (!input.trim() || !user || !currentRoom) return;
    sendMessage(currentRoom.id, input.trim());
    setInput("");
  };

  return (
    <div id="chat" className="flex flex-1 h-full">
      <AvailableRooms
        rooms={rooms}
        currentRoom={currentRoom}
        onSelectRoom={onSelectRoom}
        handleJoinLeaveRoom={handleJoinLeaveRoom}
      />
      <div id="messages-area" className="flex flex-col flex-1 bg-background overflow-hidden px-3 sm:px-6 md:px-10 lg:px-15 xl:px-20 2xl:px-35">
        <Messages user={user} messages={roomMessages} currentRoom={currentRoom} />
        {currentRoom && typingUserByRoom[currentRoom.id] && (
          <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
            <span className="animate-pulse">💬 {typingUserByRoom[currentRoom.id]} is typing...</span>
          </div>
        )}
        <MessageBox handleSend={handleSend} input={input} setInput={setInput} currentRoom={currentRoom} />
      </div>
      <UsersInRoom currentRoomUsers={currentRoomUsers} />
    </div>
  );
};

export default Chat;
