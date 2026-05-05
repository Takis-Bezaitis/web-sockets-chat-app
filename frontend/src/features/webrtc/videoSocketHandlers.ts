import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";

type CallRequestData = {
  callerId: number;
  callerName: string;
  calleeId: number;
  calleeName: string;
};

type CallResponseData = {
  accepted: boolean;
  callerId: number;
  calleeId: number;
};

type OfferData = {
  offer: RTCSessionDescriptionInit;
  callerId: number;
  calleeId: number;
};

type AnswerData = {
  answer: RTCSessionDescriptionInit;
};

type IceCandidateData = {
  candidate: RTCIceCandidateInit;
};

// =============================
// 1. INCOMING CALL (callee)
// =============================
export const handleCallRequest = (data: CallRequestData) => {
  const {
    setCallState,
    setIsCaller,
    setRemoteUserId,
    setIncomingCaller,
    setOutcomingCallee,
  } = useWebRTCStore.getState();

  // 1️⃣ Show incoming call UI
  setIncomingCaller({ id: data.callerId, username: data.callerName });
  setOutcomingCallee({ id: data.calleeId, username: data.calleeName });

  // 2️⃣ Update call state
  setCallState("ringing");
  setIsCaller(false); // This user is the callee
  setRemoteUserId(data.callerId);
};



// =============================
// 2. CALL ACCEPTED BY CALLEE (caller side)
// =============================
export const handleCallResponse = async (data: CallResponseData) => {
  if (!data.accepted) {
    const cleanupCall = useWebRTCStore.getState().cleanupCall;
    cleanupCall();
    return;
  }

  const socket = useSocketStore.getState().socket;
  const { localStream, setPeerConnection, setRemoteStream, setCallState } = useWebRTCStore.getState();

  if (!localStream) {
    console.error("Caller has no localStream");
    return;
  }

  // 1️⃣ Create PeerConnection
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 2️⃣ Attach ontrack immediately
  pc.ontrack = (event: RTCTrackEvent) => {
    const stream =
      event.streams && event.streams[0]
        ? event.streams[0]
        : new MediaStream([event.track]);
    setRemoteStream(stream);
  };

  // 3️⃣ Add local tracks
  localStream.getTracks().forEach((track) => {
    const exists = pc.getSenders().some((s) => s.track === track);
    if (!exists) pc.addTrack(track, localStream);
  });

  // 4️⃣ ICE candidates
  pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && socket) {
      socket.emit("video:webrtc-ice-candidate", {
        candidate: event.candidate,
        targetUserId: data.calleeId, // the callee
      });
    }
  };

  setPeerConnection(pc);
  setCallState("inCall");

  // 5️⃣ Create and send offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  if (socket) {
    socket.emit("video:webrtc-offer", {
      offer,
      calleeId: data.calleeId, // the callee
      callerId: data.callerId, // the caller
    });
  }
};



export const handleOffer = async (data: OfferData) => {
  const socket = useSocketStore.getState().socket;
  const { peerConnection, setPeerConnection, localStream, setRemoteStream, setCallState } =
    useWebRTCStore.getState();

  // 1️⃣ Create PeerConnection if it doesn't exist
  const pc = peerConnection || new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 2️⃣ Attach remote track listener
  pc.ontrack = (event) => {
    const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
    setRemoteStream(stream);
  };

  // 3️⃣ Add local tracks if available
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      const exists = pc.getSenders().some((s) => s.track === track);
      if (!exists) pc.addTrack(track, localStream);
    });
  }

  // 4️⃣ Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit("video:webrtc-ice-candidate", {
        candidate: event.candidate,
        targetUserId: data.callerId,
      });
    }
  };

  setPeerConnection(pc);

  // 5️⃣ Set remote description
  await pc.setRemoteDescription(data.offer);

  // 6️⃣ Create answer and send back to caller
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  if (socket) {
    socket.emit("video:webrtc-answer", {
      answer,
      callerId: data.callerId,
      calleeId: data.calleeId,
    });
  }

  // 7️⃣ Set call state
  setCallState("inCall");
};



export const handleAnswer = async (data: AnswerData) => {
  const { peerConnection } = useWebRTCStore.getState();
  if (!peerConnection) return;

  await peerConnection.setRemoteDescription(data.answer);
};

export const handleIceCandidate = async (data: IceCandidateData) => {
  const pc = useWebRTCStore.getState().peerConnection;
  if (!pc) return;

  try {
    await pc.addIceCandidate(data.candidate);
  } catch (e) {
    console.error("Error adding ICE candidate", e);
  }
};

export const onCallEnded = () => {
  const cleanupCall = useWebRTCStore.getState().cleanupCall;
  cleanupCall();
};