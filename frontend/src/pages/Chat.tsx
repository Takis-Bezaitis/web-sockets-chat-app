import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useMessageStore } from "../store/messageStore";
import { useTypingStore } from "../store/typingStore";
import { useWebRTCStore } from "../store/webrtcStore";
import type { RoomWithMembershipDTO, RoomUsers } from "../types/custom";
import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import UsersInRoom from "../components/UsersInRoom";
import Messages from "../components/Messages";
import MessageBox from "../components/MessageBox";
import MobileNavBar from "../components/MobileNavBar";
import IncomingCallModal from "../components/video/IncomingCallModal";
import VideoCallWindow from "../components/video/VideoCallWindow";

const Chat = () => {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();

  // store API
  const {
    connect,
    disconnect,
    enterRoom,
    exitRoom,
    sendMessage,
  } = useSocketStore();
  const { messagesByRoom, getLoadingForRoom } = useMessageStore();
  const { typingUserByRoom } = useTypingStore();
  const { getMessagesForRoom, fetchRoomMessages } = useMessageStore();
  // local UI state
  const [rooms, setRooms] = useState<RoomWithMembershipDTO[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomWithMembershipDTO | undefined>(undefined);
  const [currentRoomUsers, setCurrentRoomUsers] = useState<RoomUsers[]>([]);
  const [input, setInput] = useState("");
  const [mobileView, setMobileView] = useState<"chat" | "rooms" | "members">("chat");
  const [showMembers, setShowMembers] = useState(false);

  const [incomingCaller, setIncomingCaller] = useState<{ id: number; username: string } | undefined>(undefined);
  const [outcomingCallee, setOutcomingCallee] = useState<{ id: number} | undefined>(undefined);

  const setCallState = useWebRTCStore((state) => state.setCallState);
  const callState = useWebRTCStore((state) => state.callState);
  const setIsCaller = useWebRTCStore((s) => s.setIsCaller);
  const isCaller = useWebRTCStore((state) => state.isCaller);
  const setRemoteUserId = useWebRTCStore((s) => s.setRemoteUserId);

  // messages for currently selected room (derived from store)
  const roomMessages = useMemo(() => {
    if (!currentRoom) return [];
    return getMessagesForRoom(currentRoom.id);
  }, [currentRoom, messagesByRoom, getMessagesForRoom]);

  const loading = getLoadingForRoom(currentRoom?.id ?? -1);

  // connect socket on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === helper: fetch rooms (single source of truth) ===
  const fetchRooms = async (): Promise<RoomWithMembershipDTO[]> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${user?.id}/rooms`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch rooms");
      }
      const json = await res.json();
      const data = json.data ?? json;
      setRooms(data);
      return data;
    } catch (err) {
      console.error("Failed to load rooms", err);
      return [];
    }
  };

  // fetch rooms once when user id is available
  useEffect(() => {
    if (!user?.id) return;
    void fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Automatically select "general" room once rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && !currentRoom) {
      const general = rooms.find((r) => r.name === "general");
      if (general) {
        setCurrentRoom(general);
        // fetch members and subscribe to messages (no need to await)
        void getRoomUsers(general.id);
        void fetchRoomMessages(general.id);
        void enterRoom(general.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, currentRoom]);

  useEffect(() => {
    if (!socket || !currentRoom?.id) return;
  
    const handleMembershipJoined = ({ roomId }: { roomId: number }) => {
      if (Number(roomId) !== currentRoom.id) return;
      getRoomUsers(currentRoom.id);
    };

    const handleMembershipLeft = ({ roomId }: { roomId: number }) => {
      if (Number(roomId) !== currentRoom.id) return;
      getRoomUsers(currentRoom.id);
    };

    socket.on("membership:joined", handleMembershipJoined);
    socket.on("membership:left", handleMembershipLeft);

    return () => {
      socket.off("membership:joined", handleMembershipJoined);
      socket.off("membership:left", handleMembershipLeft);
    }
  },[socket, currentRoom]);

  // video
  useEffect(() => {
    if (!socket) return;

    // =============================
    // 1. INCOMING CALL (callee)
    // =============================
    const handleCallRequest = async (data: any) => {
      console.log("Incoming call:", data);

      const { setCallState, setIsCaller } = useWebRTCStore.getState();

      // 1. Show incoming call UI
      setIncomingCaller({ id: data.callerId, username: data.callerName });
      setOutcomingCallee({ id: data.calleeId });
      setCallState("ringing");
      setIsCaller(false); // important! This user is the callee
      setRemoteUserId(data.callerId);
    };

    socket.on("video:call-request", handleCallRequest);

    // =============================
    // 2. CALL ACCEPTED BY CALLEE (caller side)
    // =============================
    const handleCallResponse = async (data: any) => {
      if (!data.accepted) {
        console.log("Call declined.");
        return;
      }

      console.log("Call accepted — creating offer...");
      console.log("handleCallResponse:",data)
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
        const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
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
            targetUserId: data.calleeId, // Simon
          });
        }
      };

      setPeerConnection(pc);
      setCallState("inCall");

      // 5️⃣ Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("video:webrtc-offer", {
        offer,
        calleeId: data.calleeId, // Simon
        callerId: data.callerId // Alice
      });
    };

    socket.on("video:call-response", handleCallResponse);


    // =============================
    // 3. RECEIVING OFFER (callee)
    // =============================
    const handleOffer = async (data: any) => {
      const { peerConnection, setPeerConnection, localStream, setRemoteStream } = useWebRTCStore.getState();
      console.log("handleOffer:", data)
      // 1️⃣ Create PeerConnection if it doesn't exist (usually already created in handleAccept)
      const pc = peerConnection || new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // 2️⃣ Attach ontrack
      pc.ontrack = (event) => {
        console.log("Callee ontrack event:", event);
        const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setRemoteStream(stream);
      };

      // 3️⃣ Add local tracks if they exist
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          const exists = pc.getSenders().some((s) => s.track === track);
          if (!exists) pc.addTrack(track, localStream);
        });
      }

      // 4️⃣ Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("video:webrtc-ice-candidate", {
            candidate: event.candidate,
            targetUserId: data.callerId, // Alice
          });
        }
      };

      setPeerConnection(pc);

      // 5️⃣ Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      // 6️⃣ Create answer and send to caller
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("video:webrtc-answer", {
        answer,
        callerId: data.callerId, // Alice
        calleeId: data.calleeId, // Simon
      });

      useWebRTCStore.getState().setCallState("inCall");
    };

    socket.on("video:webrtc-offer", handleOffer);

    // =============================
    // 4. RECEIVING ANSWER (caller)
    // =============================
    const handleAnswer = async (data: any) => {
      const { peerConnection } = useWebRTCStore.getState();
      if (!peerConnection) return;

      // 1️⃣ Set remote description so Alice can receive Simon's tracks
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

      console.log("Caller: remote description set, remote tracks should flow now.");
    };

    socket.on("video:webrtc-answer", handleAnswer);

    // =============================
    // 5. ICE CANDIDATES (both sides)
    // =============================
    const handleIceCandidate = async (data: any) => {
      const pc = useWebRTCStore.getState().peerConnection;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    };

    socket.on("video:webrtc-ice-candidate", handleIceCandidate);

    // =============================
    // CLEANUP
    // =============================
    return () => {
      socket.off("video:call-request", handleCallRequest);
      socket.off("video:call-response", handleCallResponse);
      socket.off("video:webrtc-offer", handleOffer);
      socket.off("video:webrtc-answer", handleAnswer);
      socket.off("video:webrtc-ice-candidate", handleIceCandidate);
    };
  }, [socket]);


  // helper: fetch users in a room
  const getRoomUsers = async (roomId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${roomId}/room-users`,
        { credentials: "include" }
      );
      if (!response.ok) {
        // try to log helpful info
        const err = await response.json().catch(() => ({ error: "failed" }));
        throw new Error(err.error || "Failed to fetch room users");
      }
      const json = await response.json();
      setCurrentRoomUsers(json.data ?? json);
    } catch (err) {
      console.error("getRoomUsers failed:", err);
      setCurrentRoomUsers([]);
    }
  };

  // When user selects a room in the UI
  const onSelectRoom = async (room: RoomWithMembershipDTO) => {
    try {
      // exit previous room (socket subscription) if any
      if (currentRoom) {
        exitRoom(currentRoom.id);
      }

      setCurrentRoom(room);

      // Fetch messages first (REST + cache)
      await fetchRoomMessages(room.id);

      // Then subscribe via socket
      await enterRoom(room.id);

      // fetch the members for the newly selected room
      await getRoomUsers(room.id);
    } catch (err) {
      console.error("onSelectRoom error:", err);
    }
  };

  // Join / leave room membership via REST then emit membership event
  // ChatSidebar expects handleJoinLeaveRoom: (room, action: string) => void,
  // so we accept action: string and validate it here.
  const handleJoinLeaveRoom = async (room: RoomWithMembershipDTO, action: string) => {
    if (action !== "join" && action !== "leave") {
      console.warn("Unsupported action for join/leave:", action);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_ROOMS_BASE_URL}/${room.id}/${action}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "unknown" }));
        throw new Error(err.error || "Failed to join/leave room");
      }

      // Refresh local state (members + rooms). Wait both so we can update UI consistently.
      const [ , updatedRooms ] = await Promise.all([getRoomUsers(room.id), fetchRooms()]);

      // Update currentRoom (update isMember or similar flag)
      const updatedCurrentRoom = updatedRooms.find((r: any) => r.id === room.id);
      if (updatedCurrentRoom) {
        setCurrentRoom(updatedCurrentRoom);
      }

      // Notify others via socket (membership event) if socket exists
      const sock = useSocketStore.getState().socket;
      if (sock) {
        sock.emit(action === "join" ? "joinRoom" : "leaveRoom", room.id.toString());
      }
    } catch (err) {
      console.error("handleJoinLeaveRoom error:", err);
    }
  };

  // handle sending using local input state (MessageBox expects handleSend(): void)
  const handleSend = () => {
    if (!input.trim() || !user || !currentRoom) return;
    sendMessage(currentRoom.id, input.trim());
    setInput("");
  };

  return (
    <div id="chat" className="flex flex-col h-full relative">

      {/* ------- MOBILE NAV BAR (bottom) ------- */}
      <div className="lg:hidden w-full fixed bottom-0 z-20 bg-background">
        <MobileNavBar mobileView={mobileView} setMobileView={setMobileView} />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ------- SIDEBAR (hidden on mobile) ------- */}
        {user && (
          <div className="hidden lg:block w-2/5 max-w-xs">
            <ChatSidebar
              user={user}
              rooms={rooms}
              currentRoom={currentRoom}
              onSelectRoom={onSelectRoom}
              handleJoinLeaveRoom={handleJoinLeaveRoom}
            />
          </div>
        )}
        {user && mobileView === "rooms" && (
          <div className="w-full lg:hidden">
            <ChatSidebar
              user={user}
              rooms={rooms}
              currentRoom={currentRoom}
              onSelectRoom={onSelectRoom}
              handleJoinLeaveRoom={handleJoinLeaveRoom}
            />
          </div>
        )}

        {/* ------- CENTER AREA (Chat section OR mobile view switching) ------- */}
        <div className="hidden lg:flex flex-1 flex-col">  
          {currentRoom && <ChatHeader currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}/>}
          <div id="messages-area" className="flex flex-col flex-1 bg-background overflow-hidden px-3 pb-10 
          sm:px-6 md:px-10 md:pb-0 lg:px-15 xl:px-20 2xl:px-35">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <Messages user={user} messages={roomMessages} currentRoom={currentRoom} loading={loading} />
            </div>
            {currentRoom && typingUserByRoom[currentRoom.id] && (
              <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
                <span className="animate-pulse">💬 {typingUserByRoom[currentRoom.id]} is typing...</span>
              </div>
            )}
            <IncomingCallModal
              visible={callState === "ringing"}
              caller={incomingCaller || undefined}
              callee={outcomingCallee || undefined}
            />
            {(callState === "inCall" || (callState === "ringing" && isCaller)) && (
              <VideoCallWindow />
            )}
            <MessageBox handleSend={handleSend} input={input} setInput={setInput} currentRoom={currentRoom} />
          </div>
        </div>

        {mobileView === "chat" && (
          <div className="lg:hidden flex flex-1 flex-col">  
          {currentRoom && <ChatHeader currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}/>}
          <div id="messages-area" className="flex flex-col flex-1 bg-background overflow-hidden px-3 pb-10 
          sm:px-6 md:px-10">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <Messages user={user} messages={roomMessages} currentRoom={currentRoom} loading={loading} />
            </div>
            {currentRoom && typingUserByRoom[currentRoom.id] && (
              <div className="text-sm text-gray-500 italic mb-1 px-4 flex items-center gap-2">
                <span className="animate-pulse">💬 {typingUserByRoom[currentRoom.id]} is typing...</span>
              </div>
            )}
            <IncomingCallModal
              visible={callState === "ringing"}
              caller={incomingCaller || undefined}
              callee={outcomingCallee || undefined}
            />
            {(callState === "inCall" || (callState === "ringing" && isCaller)) && (
              <VideoCallWindow />
            )}
            <MessageBox handleSend={handleSend} input={input} setInput={setInput} currentRoom={currentRoom} />
          </div>
        </div>
        )}

        {/* ------- ROOM  ------- */}
        <div className="hidden xl:block w-2/5 max-w-xs">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} />
        </div>
        {showMembers && (
          <div className="hidden lg:block xl:hidden w-2/5 max-w-xs">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} />
          </div>
        )}
        {mobileView === "members" && (
          <div className="w-full lg:hidden">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} />
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Chat;
