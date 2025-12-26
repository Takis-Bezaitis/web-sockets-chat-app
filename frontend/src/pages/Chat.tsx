import { useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useSocketStore } from "../store/socketStore";
import { useMessageStore } from "../store/messageStore";
import { useTypingStore } from "../store/typingStore";
import { useWebRTCStore } from "../store/webrtcStore";

import ChatSidebar from "../components/chat/ChatSidebar";
import UsersInRoom from "../components/UsersInRoom";
import MobileNavBar from "../components/MobileNavBar";
import VideoCallWindow from "../components/video/VideoCallWindow";
import ChatContent from "../components/chat/ChatContent";
import IncomingCallModal from "../components/video/IncomingCallModal";

// import custom hooks
import { useChatRooms } from "../hooks/useChatRooms";
import { useChatSockets } from "../hooks/useChatSockets";
import { useChatLayout } from "../hooks/useChatLayout";

const Chat = () => {
  const { user } = useAuthStore();

  const {
    rooms,
    currentRoom,
    currentRoomUsers,
    onSelectRoom,
    handleJoinLeaveRoom,
  } = useChatRooms(user?.id);

  useChatSockets(currentRoom?.id);

  const {
    mobileView,
    videoOverlay,
    showMembers,
    setMobileView,
    setVideoOverlay,
    setShowMembers,
    inCall,
    callState,
    isCaller,
  } = useChatLayout();

  const { messagesByRoom, getLoadingForRoom } = useMessageStore();
  const { typingUserByRoom } = useTypingStore();
  const { getMessagesForRoom } = useMessageStore();

  // local UI state
  const [input, setInput] = useState("");

  const incomingCaller = useWebRTCStore((s) => s.incomingCaller);
  const outcomingCallee = useWebRTCStore((s) => s.outcomingCallee);

  // messages for currently selected room (derived from store)
  const roomMessages = useMemo(() => {
    if (!currentRoom) return [];
    return getMessagesForRoom(currentRoom.id);
  }, [currentRoom, messagesByRoom, getMessagesForRoom]);

  const loading = getLoadingForRoom(currentRoom?.id ?? -1);

  // send message
  const sendMessage = useSocketStore((s) => s.sendMessage);

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
