import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useMessageStore } from "../store/messageStore";
import { useTypingStore } from "../store/typingStore";
import { useWebRTCStore } from "../store/webrtcStore";
import type { RoomWithMembershipDTO, RoomUsers } from "../types/custom";
import ChatSidebar from "../components/ChatSidebar";
import UsersInRoom from "../components/UsersInRoom";
import MobileNavBar from "../components/MobileNavBar";
import VideoCallWindow from "../components/video/VideoCallWindow";
import { handleCallRequest, handleCallResponse, handleOffer, handleAnswer, handleIceCandidate, onCallEnded } from "../features/webrtc/videoSocketHandlers";
import ChatContent from "../components/chat/ChatContent";
import IncomingCallModal from "../components/video/IncomingCallModal";

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
  const [mobileView, setMobileView] = useState<"chat" | "rooms" | "members" | "video">("chat");
  const [videoOverlay, setVideoOverlay] = useState<"hidden" | "chat" | "members">("hidden");
  const [showMembers, setShowMembers] = useState(false);

  const incomingCaller = useWebRTCStore((state) => state.incomingCaller);
  const outcomingCallee = useWebRTCStore((state) => state.outcomingCallee);
  const callState = useWebRTCStore((state) => state.callState);
  const inCall = callState === "inCall";
  const isCaller = useWebRTCStore((state) => state.isCaller);

  const HEARTBEAT_INTERVAL = 25_000;

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

    socket.on("video:call-request", handleCallRequest);
    socket.on("video:call-response", handleCallResponse);
    socket.on("video:webrtc-offer", handleOffer);
    socket.on("video:webrtc-answer", handleAnswer);
    socket.on("video:webrtc-ice-candidate", handleIceCandidate);
    socket.on("video:call-ended", onCallEnded);

    socket.on("video:remote-media-state", ({ micMuted, cameraOff }) => {
      useWebRTCStore.getState().setRemoteMediaState({
        micMuted,
        cameraOff,
      });
    });

    return () => {
      socket.off("video:call-request", handleCallRequest);
      socket.off("video:call-response", handleCallResponse);
      socket.off("video:webrtc-offer", handleOffer);
      socket.off("video:webrtc-answer", handleAnswer);
      socket.off("video:webrtc-ice-candidate", handleIceCandidate);
      socket.off("video:call-ended", onCallEnded);
      socket.off("video:remote-media-state");
    };
  }, [socket]);

  useEffect(() => {
    if (callState === "inCall" || (callState === "ringing" && isCaller)) {
      setMobileView("video");
      return;
    }

    // idle
    setVideoOverlay("hidden");
    setMobileView("chat");
  }, [callState, isCaller]);

  useEffect(() => {
    if (!currentRoom) return;

    const socket = useSocketStore.getState().socket;
    if (!socket || !socket.connected) return;

    socket.emit("presence:heartbeat", String(currentRoom.id));

    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("presence:heartbeat", String(currentRoom.id));
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [currentRoom?.id]);

  useEffect(() => {
    if (callState === "idle") {
      setShowMembers(false);
    }
  }, [callState]);

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
        <MobileNavBar 
        mobileView={mobileView} setMobileView={setMobileView} 
        videoOverlay={videoOverlay} setVideoOverlay={setVideoOverlay} />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ------- SIDEBAR (hidden on mobile) ------- */}
        {user && ((!inCall && callState==="idle") || (!inCall && !isCaller)) &&  (
          <div className="hidden lg:block xl:w-3/5 xl:max-w-xs">
            <ChatSidebar
              user={user}
              rooms={rooms}
              currentRoom={currentRoom}
              onSelectRoom={onSelectRoom}
              handleJoinLeaveRoom={handleJoinLeaveRoom}
            />
          </div>
        )}
        {(user && mobileView === "rooms" && callState==="idle") && (
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

        {(callState === "inCall" || (callState === "ringing" && isCaller)) && (
          <div className="w-full lg:w-3/5">
            <VideoCallWindow 
              caller={incomingCaller?.username} 
              callee={outcomingCallee?.username} 
            />
          </div>
        )}

        {/* ------- CENTER AREA (Chat section OR mobile view switching) ------- */}
        <div className="hidden lg:flex flex-1 flex-col">  
          <ChatContent currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}
          user={user} roomMessages={roomMessages} loading={loading} 
          typingUserByRoom={typingUserByRoom} 
          handleSend={handleSend} input={input} setInput={setInput} />
        </div>

        {mobileView === "chat" && ((!inCall && callState!=="ringing" && isCaller) || (!inCall && !isCaller)) && (
          <div className="lg:hidden flex flex-1 flex-col">  
            <ChatContent currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}
              user={user} roomMessages={roomMessages} loading={loading} 
              typingUserByRoom={typingUserByRoom}
              handleSend={handleSend} input={input} setInput={setInput} />
          </div>
        )}
        
        {videoOverlay === "chat" && ((callState!="idle" && isCaller) || (inCall && !isCaller)) && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 h-[65%] bg-background rounded-t-2xl shadow-xl flex flex-col"
          >
            <ChatContent currentRoom={currentRoom} showMembers={showMembers} setShowMembers={setShowMembers}
              user={user} roomMessages={roomMessages} loading={loading}
              typingUserByRoom={typingUserByRoom}
              handleSend={handleSend} input={input} setInput={setInput}
            />
          </div>
        )}

        {/* ------- Room members for screens bigger that medium  ------- */}
        {((!inCall && callState==="idle") || (!inCall && !isCaller)) && <div className="hidden xl:block xl:w-3/5 xl:max-w-xs">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} />
        </div>}

        {/* Toggle-based members panel (LG always, XL only during call) */}
        {showMembers && (
          <div className="hidden lg:block xl:hidden lg:w-3/5 lg:max-w-xs">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom}
            />
          </div>
        )}

        {/* XL toggle when IN CALL or RINGING */}
        {showMembers && (inCall || callState==="ringing") && (
          <div className="hidden xl:block xl:w-3/5 xl:max-w-xs">
            <UsersInRoom
              user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom}
            />
          </div>
        )}

        {/* Room members for mobile screens */}
        {mobileView === "members" && (
          <div className="w-full lg:hidden">
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} onStartVideoCall={() => setMobileView("video")}/>
          </div>
        )}
        
        {videoOverlay === "members" && ((callState!="idle" && isCaller) || (inCall && !isCaller)) && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 h-[65%] bg-background rounded-t-2xl shadow-xl flex flex-col"
          >
            <UsersInRoom user={user} currentRoomUsers={currentRoomUsers} currentRoom={currentRoom} onStartVideoCall={() => setMobileView("video")}/>
          </div>
        )}

        <IncomingCallModal
            visible={(callState === "ringing" && !isCaller )}
            caller={incomingCaller || undefined}
            callee={outcomingCallee || undefined}
        />
        
      </div>
    </div>
  );
};

export default Chat;
