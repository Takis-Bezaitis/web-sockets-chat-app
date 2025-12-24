import { useWebRTCStore } from "../../store/webrtcStore";
import { useSocketStore } from "../../store/socketStore";

interface IncomingCallModalProps {
  visible: boolean;
  caller?: { id: number; username: string };
  callee?: { id: number };
};

export default function IncomingCallModal({ visible, caller, callee }: IncomingCallModalProps) {
    const { socket } = useSocketStore();
    const cleanupCall = useWebRTCStore((s) => s.cleanupCall);

    if (!visible || !caller) return null;

    const handleAccept = async () => {
    if (!socket) return;

    const {
      setLocalStream,
      setRemoteStream,
      setPeerConnection,
      setCallState,
    } = useWebRTCStore.getState();

    // 1️⃣ Get local media (video + audio)
    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(localStream);
    } catch (err) {
      console.error("Failed to get local media:", err);
      return;
    }

    // 2️⃣ Create PeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // 3️⃣ Attach ontrack immediately
    pc.ontrack = (event) => {
      console.log("Callee ontrack event:", event);
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      setRemoteStream(stream);
    };

    // 4️⃣ Add local tracks to PeerConnection
    localStream.getTracks().forEach((track) => {
      const exists = pc.getSenders().some((s) => s.track === track);
      if (!exists) pc.addTrack(track, localStream);
    });

    // 5️⃣ Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && caller) {
        socket.emit("video:webrtc-ice-candidate", {
          candidate: event.candidate,
          targetUserId: caller.id, // Send to Alice (caller)
        });
      }
    };

    // 6️⃣ Save PeerConnection in Zustand
    setPeerConnection(pc);

    // 7️⃣ Notify caller that call is accepted
    socket.emit("video:call-response", {
      accepted: true,
      callerId: caller?.id, // Alice's ID
      calleeId: callee?.id, // Simon's ID
    });

    // 8️⃣ Update call state to inCall
    setCallState("inCall");
  };



  const handleDecline = () => {
    if (!socket) return;
    socket.emit("video:call-response", {
      accepted: false,
      callerId: caller.id,
    });
    cleanupCall();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-1">
      <div className="bg-surface rounded-lg p-6 shadow-xl text-foreground min-w-[300px]">
        <h2 className="text-xl font-semibold mb-4">
          Incoming call from {caller.username}
        </h2>
        <div className="flex justify-around mt-4">
          <button onClick={handleAccept} className="px-4 py-2 bg-green-600 rounded-md text-white cursor-pointer">
            Accept
          </button>
          <button onClick={handleDecline} className="px-4 py-2 bg-red-600 rounded-md text-white cursor-pointer">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
