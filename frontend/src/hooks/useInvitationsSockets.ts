import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useInvitationStore } from "../store/invitationStore";
import { useChatRooms } from "./useChatRooms";

export const useInvitations = () => {
  const { user } = useAuthStore();
  const { refetchRooms } = useChatRooms(user?.id);
  
  const fetchInvitations = async () => {
    try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_INVITATIONS_BASE_URL}`, {
        credentials: "include",
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
        const res = await fetch(`${import.meta.env.VITE_BACKEND_INVITATIONS_BASE_URL}/${invitationId}/accept`, {
          method: "POST",
          credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to accept invitation");

        await fetch(`${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${roomId}/join`, {
          method: "POST",
          credentials: "include",
        });
        
        refetchRooms();

        useInvitationStore.getState().removeInvitation(invitationId);

    } catch (err) {
        console.error(err);
    }
  };

  const declineInvitation = async (invitationId: number) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_INVITATIONS_BASE_URL}/${invitationId}/decline`, {
          method: "POST",
          credentials: "include", 
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


