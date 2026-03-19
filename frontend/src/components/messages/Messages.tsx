import { useEffect, useRef, useCallback } from "react";
import { useMessageStore } from "../../store/messageStore";
import { type User, type Message, type RoomDTO } from "../../types/custom";
import Spinner from "../ui/Spinner";
import { onNewMessage } from "../../store/messageStore";
import MessageItem from "./MessageItem";

type UserProps = {
  user: User | null;
  messages: Message[];
  currentRoom: RoomDTO | undefined;
  loading: boolean;
  onRegisterScroll: (fn: (id: number) => void) => void;
};

const Messages = ({ user, messages, currentRoom, loading, onRegisterScroll }: UserProps) => {
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const fetchRoomMessages = useMessageStore((s) => s.fetchRoomMessages);
  const hasMore = useMessageStore(
    (s) => (currentRoom ? s.hasMoreByRoom[currentRoom.id] : false)
  );

  /* ----------------------------------
     Scroll to specific message
     ---------------------------------- */
  const scrollToMessage = (id: number) => {
    const el = document.getElementById(`message-${id}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    el.classList.add("ring-2", "ring-yellow-400");
    setTimeout(() => el.classList.remove("ring-2", "ring-yellow-400"), 1500);
  };

  /* ----------------------------------
     New message auto-scroll
     ---------------------------------- */
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

  /* ----------------------------------
     Scroll on new messages
     ---------------------------------- */
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length]);

  /* ----------------------------------
     Detect user scrolling
     ---------------------------------- */
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

  useEffect(() => {
    onRegisterScroll(scrollToMessage);
  }, [onRegisterScroll]);

  /* ----------------------------------
     Load older messages
     ---------------------------------- */
  const loadOlderMessages = useCallback(async () => {
    if (!currentRoom || messages.length === 0 || !hasMore) return;

    const container = containerRef.current;
    if (!container) return;

    const previousScrollHeight = container.scrollHeight;

    await fetchRoomMessages(currentRoom.id);

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

      {messages
        .filter((msg) => msg.replyToId === null)
        .map((msg) => (
          <MessageItem key={msg.id} message={msg} user={user} />
        ))}

      <div ref={bottomRef} />
    </div>
  );
};

export default Messages;