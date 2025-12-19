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

  incomingCaller: { id: number; username: string } | null;
  outcomingCallee: { id: number; username: string } | null;

  isMicMuted: boolean;
  isCameraOff: boolean;

  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;

  setCallState: (state: CallState) => void;
  setIsCaller: (caller: boolean) => void;
  setRemoteUserId: (id: number | null) => void;

  setIncomingCaller: (caller: { id: number; username: string } | null) => void;
  setOutcomingCallee: (callee: { id: number; username: string } | null) => void;

  toggleMic: () => void;
  toggleCamera: () => void;

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

  incomingCaller: null,
  outcomingCallee: null,

  isMicMuted: false,
  isCameraOff: false,

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  setCallState: (state) => set({ callState: state }),
  setIsCaller: (caller) => set({ isCaller: caller }),
  setRemoteUserId: (id) => set({ remoteUserId: id }),

  setIncomingCaller: (caller) => set({ incomingCaller: caller }),
  setOutcomingCallee: (callee) => set({ outcomingCallee: callee }),

  toggleMic: () => {
    const { localStream, isMicMuted } = get();
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = isMicMuted;
    });
    set({ isMicMuted: !isMicMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = isCameraOff;
    });
    set({ isCameraOff: !isCameraOff });
  },

  declineCall: () =>
    set({
      callState: "idle",
      isCaller: false,
      remoteUserId: null,
      incomingCaller: null,
      outcomingCallee: null,
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
      incomingCaller: null,
      outcomingCallee: null,
      isMicMuted: false,
      isCameraOff: false,
    });
  },
}));
