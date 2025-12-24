import { create } from "zustand";
import { useSocketStore } from "./socketStore";

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

  isRemoteMicMuted: boolean;
  isRemoteCameraOff: boolean;

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
  setRemoteMediaState: (state: {
    micMuted: boolean;
    cameraOff: boolean;
  }) => void;

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

  isRemoteMicMuted: false,
  isRemoteCameraOff: false,

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  setCallState: (state) => set({ callState: state }),
  setIsCaller: (caller) => set({ isCaller: caller }),
  setRemoteUserId: (id) => set({ remoteUserId: id }),

  setIncomingCaller: (caller) => set({ incomingCaller: caller }),
  setOutcomingCallee: (callee) => set({ outcomingCallee: callee }),

  toggleMic: () => {
    const { localStream, isMicMuted, remoteUserId } = get();
    const socket = useSocketStore.getState().socket;

    localStream?.getAudioTracks().forEach(track => {
      track.enabled = isMicMuted;
    });

    const newMutedState = !isMicMuted;
    set({ isMicMuted: newMutedState });

    if (socket && remoteUserId) {
      socket.emit("video:media-state", {
        targetUserId: remoteUserId,
        micMuted: newMutedState,
        cameraOff: get().isCameraOff,
      });
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff, remoteUserId } = get();
    const socket = useSocketStore.getState().socket;

    localStream?.getVideoTracks().forEach(track => {
      track.enabled = isCameraOff;
    });

    const newCameraState = !isCameraOff;
    set({ isCameraOff: newCameraState });

    if (socket && remoteUserId) {
      socket.emit("video:media-state", {
        targetUserId: remoteUserId,
        micMuted: get().isMicMuted,
        cameraOff: newCameraState,
      });
    }
  },

  setRemoteMediaState: ({ micMuted, cameraOff }) =>
    set({
      isRemoteMicMuted: micMuted,
      isRemoteCameraOff: cameraOff,
    }),

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
