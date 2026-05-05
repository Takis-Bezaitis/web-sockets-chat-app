import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { RoomWithMembershipDTO, RoomUsers } from "../types/custom";
import { useSocketStore } from "../store/socketStore";
import { useRoomStore } from "../store/roomStore";
import { useAuthStore } from "../store/authStore";
import { API } from "../api/api";


export function useChatRooms(userId?: number) {
  const { user } = useAuthStore();

  const enterRoom = useSocketStore(s => s.enterRoom);
  const exitRoom = useSocketStore(s => s.exitRoom);

  const [currentRoom, setCurrentRoom] = useState<RoomWithMembershipDTO>();
  const [currentRoomUsers, setCurrentRoomUsers] = useState<RoomUsers[]>([]);

  const roomsById = useRoomStore((r) => r.rooms);
  const rooms = useMemo(
    () => Object.values(roomsById),
    [roomsById]
  );

  const fetchRooms = useCallback(async (): Promise<RoomWithMembershipDTO[]> => {
    if (!userId) return [];

    try {
      const res = await fetch(`${API.rooms}/${userId}/rooms`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch rooms");
      }

      const json = await res.json();
      const data = json.data ?? json;

      useRoomStore.getState().setRooms(data);

      return data;
    } catch (err) {
      console.error("fetchRooms failed:", err);
      return [];
    }
  }, [userId]);

  const getRoomUsers = useCallback(async (roomId: number) => {
    try {
      const res = await fetch(`${API.rooms}/${roomId}/room-users`, {
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
  }, []);

  const onSelectRoom = useCallback(async (room: RoomWithMembershipDTO) => {
    if (room.id === currentRoom?.id) return;
    
    try {
      if (currentRoom) {
        exitRoom(currentRoom.id);
      }

      setCurrentRoomUsers([]);

      await enterRoom(room.id);
      await getRoomUsers(room.id);

      setCurrentRoom(room);
    } catch (err) {
      console.error("onSelectRoom failed:", err);
    }
  }, [currentRoom?.id, exitRoom, enterRoom, getRoomUsers, setCurrentRoom, setCurrentRoomUsers]);

  
  const handleJoinLeaveRoom = useCallback(async (
    room: RoomWithMembershipDTO,
    action: "join" | "leave"
  ) => {
    try {
      const res = await fetch(`${API.rooms}/${room.id}/${action}`, {
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
        socket.emit(action === "join" ? "joinRoom" : "leaveRoom", room.id);
      }
    } catch (err) {
      console.error("handleJoinLeaveRoom failed:", err);
    }
  }, [fetchRooms, currentRoom?.id, getRoomUsers, setCurrentRoom]);

  useEffect(() => {
    if (!userId) return;
    void fetchRooms();
  }, [userId]);

  useEffect(() => {
    if (!rooms.length || currentRoom) return;

    const general = rooms.find((r) => r.name === "general");
    if (!general) return;

    onSelectRoom(general);
 
  }, [rooms, currentRoom, onSelectRoom]);

  /* =========================
    Membership socket listeners
    ========================= */

  useEffect(() => {
    const socket = useSocketStore.getState().socket;
    if (!socket || !currentRoom?.id) return;

    const handleMembershipJoined = ({ roomId, userLeft, }: { 
      roomId: number;
      userLeft: { id: number; username: string };
    }) => {
      if (roomId !== currentRoom.id) return;

     
      toast(`${userLeft.username} joined #${currentRoom.name}`);
      getRoomUsers(currentRoom.id);
    };

    const handleMembershipLeft = async ({ roomId, userLeft, }: { 
      roomId: number;
      userLeft: { id: number; username: string };
    }) => {
      if (roomId !== currentRoom.id) return;

      if (user?.id !== userLeft.id) {
        toast(`${userLeft.username} left #${currentRoom.name}`);
      }
        
      const updatedRooms = await fetchRooms();
      const stillInRoom = updatedRooms.find(r => r.id === roomId);

      if (stillInRoom?.isPrivate && userId !== stillInRoom.creatorId) {
        const fallbackRoom =
          updatedRooms.find(r => r.name === "general");

        if (fallbackRoom) {
          onSelectRoom(fallbackRoom);
        }
      } else {
        getRoomUsers(roomId);
      }
      
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
