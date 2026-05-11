import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useInvitationStore } from "../store/invitationStore";
import { useChatRooms } from "./useChatRooms";
import { API } from "../api/api";

export const useInvitations = () => {
  const { user } = useAuthStore();
  const { refetchRooms } = useChatRooms(user?.id);
  
  const fetchInvitations = async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return;
      const res = await fetch(API.invitations, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
      });
      const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch invitations");
    }

    useInvitationStore.getState().setInvitations(data.data);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    }
  };

  const acceptInvitation = async (invitationId: number, roomId: number) => {
    try {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const res = await fetch(`${API.invitations}/${invitationId}/accept`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to accept invitation");

        await fetch(`${API.rooms}/${roomId}/join`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        
        refetchRooms();

        useInvitationStore.getState().removeInvitation(invitationId);

        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit("joinRoom", roomId);
        }

    } catch (err) {
        console.error(err);
    }
  };

  const declineInvitation = async (invitationId: number) => {
    try {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const res = await fetch(`${API.invitations}/${invitationId}/decline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to decline invitation");
        
        useInvitationStore.getState().removeInvitation(invitationId);
    } catch (err) {
        console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchInvitations();
  }, [user]);

  return {
    fetchInvitations,
    acceptInvitation,
    declineInvitation
  };

};


