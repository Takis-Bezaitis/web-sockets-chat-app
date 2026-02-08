import { useEffect, useRef, useState, useCallback } from "react";
import { useSocketStore } from "../../store/socketStore";
import { useMessageStore } from "../../store/messageStore";
import { type User, type Message, type RoomDTO } from "../../types/custom";
import { formatDate } from "../../utils/formatDate";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import Spinner from "../Spinner";
import { onNewMessage } from "../../store/messageStore";

type UserProps = {
  user: User | null;
  messages: Message[];
  currentRoom: RoomDTO | undefined;
  loading: boolean;
};

const Messages = ({ user, messages, currentRoom, loading }: UserProps) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const fetchRoomMessages = useMessageStore((s) => s.fetchRoomMessages);
  const hasMore = useMessageStore(
    (s) => (currentRoom ? s.hasMoreByRoom[currentRoom.id] : false)
  );
  
  // real new message --> scroll at the bottom
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribe = onNewMessage(currentRoom.id, () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: "auto" });
        });
      });
    });

    return () => unsubscribe();
  }, [currentRoom]);

  // for older messages
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length]);

  // scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* ----------------------------------
     Intersection Observer (TOP)
     ---------------------------------- */
  const loadOlderMessages = useCallback(async () => {
    if (!currentRoom || messages.length === 0 || !hasMore) return;

    const container = containerRef.current;
 
    if (!container) return;

    const previousScrollHeight = container.scrollHeight;

    await fetchRoomMessages(currentRoom.id);

    // Preserve scroll position
    requestAnimationFrame(() => {
      if (!container) return;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop += newScrollHeight - previousScrollHeight;
    });
  }, [currentRoom, messages, hasMore, fetchRoomMessages]);

  useEffect(() => {
    if (!topSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadOlderMessages();
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    );

    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [loadOlderMessages]);

  /* ----------------------------------
     Message editing
     ---------------------------------- */
  const submitEdit = (messageId: number, roomId: number) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    const original = messages.find((m) => m.id === messageId)?.text;
    if (!editingText.trim() || editingText === original) {
      cancelEdit();
      return;
    }

    socket.emit("message:edit", {
      id: messageId,
      roomId,
      text: editingText,
    });

    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  /* ----------------------------------
     Loading state
     ---------------------------------- */
  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 px-4 pt-5 pb-4 space-y-2 overflow-y-auto min-h-0 place-content-end"
    >
      {/* TOP SENTINEL */}
      <div ref={topSentinelRef} />

      {!loading &&
        currentRoom &&
        messages.length === 0 &&
        currentRoom.hasUserMessages === false && (
          <section className="py-6">
            <h2 className="text-4xl font-bold text-foreground">
              {currentRoom.isPrivate && "🔒"} #{currentRoom.name}
            </h2>
            <p className="text-lg text-foreground mt-2">
              Welcome! This is the start of the{" "}
              {currentRoom.isPrivate && "🔒"} #{currentRoom.name} channel.
            </p>
          </section>
        )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`relative flex gap-2 max-w-fit text-left mt-6 mb-11 p-3 rounded cursor-pointer ${
            msg.userId === user?.id
              ? "bg-message-user"
              : "bg-message-other-user"
          }`}
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          {hoveredMessageId === msg.id && (
            <MessageActions
              userId={user?.id}
              message={msg}
              onEdit={(m) => {
                setEditingMessageId(m.id);
                setEditingText(m.text);
              }}
            />
          )}

          <div className="text-3xl">👤</div>

          <div>
            <span className="font-semibold">
              {msg.userId === user?.id ? "You" : msg.username}
            </span>{" "}
            {formatDate(msg.createdAt)}

            {editingMessageId === msg.id ? (
              <input
                className="w-full bg-transparent outline-none border-b"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitEdit(msg.id, msg.roomId);
                  if (e.key === "Escape") cancelEdit();
                }}
                autoFocus
              />
            ) : (
              <div>{msg.text}</div>
            )}
          </div>
          {msg.reactions.length > 0 && <MessageReactions reactions={msg.reactions ?? []} />}
        </div>
      ))}

      {/* BOTTOM SCROLL TARGET */}
      <div ref={bottomRef} />
    </div>
  );
};

export default Messages;
