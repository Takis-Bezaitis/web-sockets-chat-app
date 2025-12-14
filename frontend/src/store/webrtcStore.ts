import { create } from "zustand";

export type CallState = "idle" | "ringing" | "inCall";

interface WebRTCStore {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  callState: CallState;

  // true if THIS user initiated the call
  isCaller: boolean;

  // The user on the OTHER side of the call
  remoteUserId: number | null;

  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;

  setCallState: (state: CallState) => void;
  setIsCaller: (caller: boolean) => void;
  setRemoteUserId: (id: number | null) => void;

  declineCall: () => void;
  cleanupCall: () => void;
}

export const useWebRTCStore = create<WebRTCStore>((set, get) => ({
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callState: "idle",

  isCaller: false,
  remoteUserId: null,

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  setCallState: (state) => set({ callState: state }),
  setIsCaller: (caller) => set({ isCaller: caller }),
  setRemoteUserId: (id) => set({ remoteUserId: id }),

  declineCall: () =>
    set({
      callState: "idle",
      isCaller: false,
      remoteUserId: null,
    }),

  cleanupCall: () => {
    const { peerConnection, localStream, remoteStream } = get();

    peerConnection?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callState: "idle",
      isCaller: false,
      remoteUserId: null,
    });
  },
}));
