import { useEffect, useState } from "react";
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

import { useUsersStore } from "../store/usersStore";
import CreateNewRoom from "../components/chat/CreateNewRoom";
import RoomMembersInvite from "../components/invitations/RoomMembersInvite";
import ChatHeader from "../components/chat/ChatHeader";

const Chat = () => {
  const { user } = useAuthStore();
  const { rooms, currentRoom, currentRoomUsers, onSelectRoom, handleJoinLeaveRoom } = useChatRooms(user?.id);

  useChatSockets(currentRoom?.id);

  const { mobileView, videoOverlay, showMembers, setMobileView, setVideoOverlay, setShowMembers, 
    inCall, callState, isCaller } = useChatLayout();

  const { typingUserByRoom } = useTypingStore();

  // local UI state
  const [input, setInput] = useState("");

  const incomingCaller = useWebRTCStore((s) => s.incomingCaller);
  const outcomingCallee = useWebRTCStore((s) => s.outcomingCallee);

  const [showCreateRoom, setShowCreateRoom] = useState<boolean>(false);
  const [inviteMembersVisible, setInviteMembersVisible] = useState<boolean>(false);
  const [inviteRoomId, setInviteRoomId] = useState<number | null>(null);
  const [inviteRoomName, setInviteRoomName] = useState<string>("");
  const { users, fetchUsers } = useUsersStore();
  
  // messages for currently selected room (derived from store)
  const roomId = currentRoom?.id;

  const safeRoomMessages = useMessageStore(
    s => (roomId !== undefined ? s.messagesByRoom[roomId] : undefined),
  );

  const safeLoading = useMessageStore(
    s => (roomId !== undefined ? s.loadingByRoom[roomId] : undefined),
  );

  const roomMessages = safeRoomMessages ?? [];
  const loading = safeLoading ?? false;

  // send message
  const sendMessage = useSocketStore((s) => s.sendMessage);

  const handleSend = () => {
    if (!input.trim() || !user || !currentRoom) return;
    sendMessage(currentRoom.id, input.trim());
    setInput("");
  };

  const handleInviteMembers = (roomId: number, roomName: string) => {
    setInviteRoomId(roomId);
    setInviteRoomName(roomName);
    setInviteMembersVisible(true);
  };

  const closeInviteMembers = () => {
    setInviteRoomId(null);
    setInviteRoomName("");
    setInviteMembersVisible(false);
  };

  const chatLayoutClasses = `
    hidden md:flex flex-col min-w-0
    ${(callState === "idle" || (callState === "ringing" && !isCaller)) ? "flex-1" : "md:w-1/3 md:min-w-xs xl:w-1/4 xl:min-w-md"}`;

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

  return (
    <div id="chat" className="flex flex-col h-full relative">
      {currentRoom && (
        <ChatHeader 
          user={user} 
          currentRoom={currentRoom} 
          showMembers={showMembers} 
          setShowMembers={setShowMembers}
        />)}

      {/* ------- MOBILE NAV BAR (bottom) ------- */}
      <div className="md:hidden w-full fixed bottom-0 z-20 bg-background">
        <MobileNavBar 
        mobileView={mobileView} setMobileView={setMobileView} 
        videoOverlay={videoOverlay} setVideoOverlay={setVideoOverlay} />
      </div>
      
      {showCreateRoom && (
        <CreateNewRoom onClose={() => setShowCreateRoom(false)} />
      )}

      {inviteMembersVisible && inviteRoomId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <RoomMembersInvite inviteRoomId={inviteRoomId} roomName={inviteRoomName} mode='manage' onCloseInviteMembers={closeInviteMembers} />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ------- SIDEBAR (hidden on mobile) ------- */}
        {user && ((!inCall && callState==="idle") || (!inCall && !isCaller)) &&  (
          <div className="hidden md:block md:w-3/5 md:max-w-xs">
            <ChatSidebar
              user={user}
              rooms={rooms}
              currentRoom={currentRoom}
              onSelectRoom={onSelectRoom}
              handleJoinLeaveRoom={handleJoinLeaveRoom}
              onCreateRoom={() => setShowCreateRoom(true)}
              onInviteMembers={handleInviteMembers}
            />
          </div>
        )}
        {(user && mobileView === "rooms" && callState==="idle") && (
          <div className="w-full md:hidden">
            <ChatSidebar
              user={user}
              rooms={rooms}
              currentRoom={currentRoom}
              onSelectRoom={onSelectRoom}
              handleJoinLeaveRoom={handleJoinLeaveRoom}
              onCreateRoom={() => setShowCreateRoom(true)}
              onInviteMembers={() => setInviteMembersVisible(true)}
            />
          </div>
        )}

        {(callState === "inCall" || (callState === "ringing" && isCaller)) && (
          <div className="flex-1 w-2/3 lg:w-3/5">
            <VideoCallWindow 
              caller={incomingCaller?.username} 
              callee={{id: outcomingCallee?.id, name: outcomingCallee?.username}} 
            />
          </div>
        )}

        <div className={chatLayoutClasses}>
          <ChatContent
            currentRoom={currentRoom}
            user={user}
            roomMessages={roomMessages}
            loading={loading}
            typingUserByRoom={typingUserByRoom}
            handleSend={handleSend}
            input={input}
            setInput={setInput}
            handleJoinLeaveRoom={handleJoinLeaveRoom}
          />
        </div>


        {/* mobile */}

        {mobileView === "chat" && ((!inCall && callState!=="ringing" && isCaller) || (!inCall && !isCaller)) && (
          <div className="md:hidden flex flex-1 flex-col">
            <ChatContent currentRoom={currentRoom} 
              user={user} roomMessages={roomMessages} loading={loading} 
              typingUserByRoom={typingUserByRoom}
              handleSend={handleSend} input={input} setInput={setInput} handleJoinLeaveRoom={handleJoinLeaveRoom}/>
          </div>
        )}
        
        {videoOverlay === "chat" && ((callState!="idle" && isCaller) || (inCall && !isCaller)) && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 h-[43%] 
              rounded-t-2xl shadow-xl flex flex-col"
          >
            <ChatContent currentRoom={currentRoom} 
              user={user} roomMessages={roomMessages} loading={loading}
              typingUserByRoom={typingUserByRoom}
              handleSend={handleSend} input={input} setInput={setInput} handleJoinLeaveRoom={handleJoinLeaveRoom}
              videoAndChat={true}
            />
          </div>
        )}

        {/* Room members for mobile screens */}
        {mobileView === "members" && (
          <div className="w-full md:hidden">
            <UsersInRoom 
              user={user} 
              currentRoomUsers={currentRoomUsers} 
              currentRoom={currentRoom} 
              mobileView={mobileView}
              onStartVideoCall={() => setMobileView("video")}/>
          </div>
        )}
        
        {videoOverlay === "members" && ((callState!="idle" && isCaller) || (inCall && !isCaller)) && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 h-[38%] mb-10
              bg-background rounded-t-2xl shadow-xl flex flex-col"
            >
            <UsersInRoom 
              user={user} 
              currentRoomUsers={currentRoomUsers} 
              currentRoom={currentRoom}
              videoOverlay={videoOverlay} 
              onStartVideoCall={() => setMobileView("video")}/>
          </div>
        )}

        <IncomingCallModal
            visible={(callState === "ringing" && !isCaller )}
            caller={incomingCaller || undefined}
            callee={outcomingCallee || undefined}
        />
        {showMembers && (
        <div
          className="
            hidden md:flex top-14 right-0 bottom-0 z-40
            md:w-fit lg:w-80 flex-col
            bg-component-background
            shadow-xl
          "
        >
          <UsersInRoom
            user={user}
            currentRoomUsers={currentRoomUsers}
            currentRoom={currentRoom}
            setShowMembers={setShowMembers}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default Chat;
