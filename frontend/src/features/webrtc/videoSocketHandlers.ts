import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";

// =============================
// 1. INCOMING CALL (callee)
// =============================
export const handleCallRequest = (data: any) => {
  console.log("Incoming call:", data);

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
export const handleCallResponse = async (data: any) => {
  if (!data.accepted) {
    console.log("Call declined.");
    const cleanupCall = useWebRTCStore.getState().cleanupCall;
    cleanupCall();
    return;
  }

  const socket = useSocketStore.getState().socket;

  console.log("Call accepted — creating offer...");
  console.log("handleCallResponse:", data);

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
  pc.ontrack = (event) => {
    console.log("Caller ontrack event:", event);
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
  pc.onicecandidate = (event) => {
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



export const handleOffer = async (data: any) => {
  const socket = useSocketStore.getState().socket;
  const { peerConnection, setPeerConnection, localStream, setRemoteStream, setCallState } =
    useWebRTCStore.getState();

  console.log("handleOffer:", data);

  // 1️⃣ Create PeerConnection if it doesn't exist
  const pc = peerConnection || new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 2️⃣ Attach remote track listener
  pc.ontrack = (event) => {
    console.log("Callee ontrack event:", event);
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
  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

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



export const handleAnswer = async (data: any) => {
  const { peerConnection } = useWebRTCStore.getState();
  if (!peerConnection) return;

  // 1️⃣ Set remote description so caller can receive callee's tracks
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

  console.log("Caller: remote description set, remote tracks should flow now.");
};

export const handleIceCandidate = async (data: any) => {
  const pc = useWebRTCStore.getState().peerConnection;
  if (!pc) return;

  try {
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  } catch (e) {
    console.error("Error adding ICE candidate", e);
  }
};



export const onCallEnded = () => {
  const cleanupCall = useWebRTCStore.getState().cleanupCall;

  console.log("Remote user ended the call");
  cleanupCall();
};