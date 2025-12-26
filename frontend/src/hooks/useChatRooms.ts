import { useEffect, useState } from "react";
import type { RoomWithMembershipDTO, RoomUsers } from "../types/custom";
import { useSocketStore } from "../store/socketStore";
import { useMessageStore } from "../store/messageStore";

const ROOMS_BASE_URL = import.meta.env.VITE_BACKEND_ROOMS_BASE_URL;

export function useChatRooms(userId?: number) {
  const { enterRoom, exitRoom } = useSocketStore();
  const { fetchRoomMessages } = useMessageStore();

  const [rooms, setRooms] = useState<RoomWithMembershipDTO[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomWithMembershipDTO>();
  const [currentRoomUsers, setCurrentRoomUsers] = useState<RoomUsers[]>([]);

  /* =========================
     Fetch all rooms for user
     ========================= */
  const fetchRooms = async (): Promise<RoomWithMembershipDTO[]> => {
    if (!userId) return [];

    try {
      const res = await fetch(`${ROOMS_BASE_URL}/${userId}/rooms`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch rooms");
      }

      const json = await res.json();
      const data = json.data ?? json;
      setRooms(data);
      return data;
    } catch (err) {
      console.error("fetchRooms failed:", err);
      return [];
    }
  };

  /* =========================
     Fetch users in a room
     ========================= */
  const getRoomUsers = async (roomId: number) => {
    try {
      const res = await fetch(`${ROOMS_BASE_URL}/${roomId}/room-users`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch room users");
      }

      const json = await res.json();
      setCurrentRoomUsers(json.data ?? json);
    } catch (err) {
      console.error("getRoomUsers failed:", err);
      setCurrentRoomUsers([]);
    }
  };

  /* =========================
     Select a room
     ========================= */
  const onSelectRoom = async (room: RoomWithMembershipDTO) => {
    try {
      if (currentRoom) {
        exitRoom(currentRoom.id);
      }

      setCurrentRoom(room);

      await fetchRoomMessages(room.id);
      await enterRoom(room.id);
      await getRoomUsers(room.id);
    } catch (err) {
      console.error("onSelectRoom failed:", err);
    }
  };

  /* =========================
     Join / Leave room
     ========================= */
  const handleJoinLeaveRoom = async (
    room: RoomWithMembershipDTO,
    action: "join" | "leave"
  ) => {
    try {
      const res = await fetch(`${ROOMS_BASE_URL}/${room.id}/${action}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "unknown" }));
        throw new Error(err.error || "Join/Leave failed");
      }

      const updatedRooms = await fetchRooms();

      if (currentRoom?.id === room.id) {
        await getRoomUsers(room.id);
      }

      if (currentRoom) {
        const updatedCurrentRoom = updatedRooms.find(
          (r) => r.id === currentRoom.id
        );
        if (updatedCurrentRoom) {
          setCurrentRoom(updatedCurrentRoom);
        }
      }

      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit(action === "join" ? "joinRoom" : "leaveRoom", room.id.toString());
      }
    } catch (err) {
      console.error("handleJoinLeaveRoom failed:", err);
    }
  };

  /* =========================
     Initial rooms fetch
     ========================= */
  useEffect(() => {
    if (!userId) return;
    void fetchRooms();
  }, [userId]);

  /* =========================
     Auto-select general room
     ========================= */
  useEffect(() => {
    if (rooms.length === 0 || currentRoom) return;

    const general = rooms.find((r) => r.name === "general");
    if (!general) return;

    setCurrentRoom(general);
    void fetchRoomMessages(general.id);
    void enterRoom(general.id);
    void getRoomUsers(general.id);
  }, [rooms, currentRoom, enterRoom, fetchRoomMessages]);

  /* =========================
   Membership socket listeners
   ========================= */
useEffect(() => {
  const socket = useSocketStore.getState().socket;
  if (!socket || !currentRoom?.id) return;

  const handleMembershipJoined = ({ roomId }: { roomId: number }) => {
    if (roomId !== currentRoom.id) return;
    getRoomUsers(currentRoom.id);
  };

  const handleMembershipLeft = ({ roomId }: { roomId: number }) => {
    if (roomId !== currentRoom.id) return;
    getRoomUsers(currentRoom.id);
  };

  socket.on("membership:joined", handleMembershipJoined);
  socket.on("membership:left", handleMembershipLeft);

  return () => {
    socket.off("membership:joined", handleMembershipJoined);
    socket.off("membership:left", handleMembershipLeft);
  };
}, [currentRoom?.id]);


  return {
    rooms,
    currentRoom,
    currentRoomUsers,
    setCurrentRoom,
    onSelectRoom,
    handleJoinLeaveRoom,
    refetchRooms: fetchRooms,
  };
}
