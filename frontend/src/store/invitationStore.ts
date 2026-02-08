import { create } from "zustand";
import type { InvitationDTO } from "../types/custom";

interface InvitationState {
  invitations: Record<number, InvitationDTO>; 
  setInvitations: (list: InvitationDTO[]) => void;
  addInvitation: (inv: InvitationDTO) => void;
  removeInvitation: (id: number) => void;
  clearInvitations: () => void;
}

export const useInvitationStore = create<InvitationState>((set) => ({
  invitations: {},

  setInvitations: (list: InvitationDTO[]) => {
    const map: Record<number, InvitationDTO> = {};
    list.forEach((inv) => {
      map[inv.id] = inv;
    });
    set({ invitations: map });
  },

  addInvitation: (inv: InvitationDTO) => {
    set((state) => ({
      invitations: { ...state.invitations, [inv.id]: inv },
    }));
  },

  removeInvitation: (id: number) => {
    set((state) => {
      const copy = { ...state.invitations };
      delete copy[id];
      return { invitations: copy };
    });
  },

  clearInvitations: () => set({ invitations: {} }),
}));
