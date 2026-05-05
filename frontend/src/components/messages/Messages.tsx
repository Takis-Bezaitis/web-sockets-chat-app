import { useEffect, useRef, useCallback, memo } from "react";
import { useMessageStore } from "../../store/messageStore";
import { type User, type Message, type RoomDTO } from "../../types/custom";
import Spinner from "../ui/Spinner";
import { onNewMessage } from "../../store/messageStore";
import MessageItem from "./MessageItem";
import { AUTO_SCROLL_THRESHOLD_PX } from "../../constants/message";

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
  const setAnchorMessageId = useMessageStore((s) => s.setAnchorMessageId);
  const getAnchorMessageId = useMessageStore((s) => s.getAnchorMessageId);
  const setAnchorOffset = useMessageStore((s) => s.setAnchorOffset);
  const getAnchorOffset = useMessageStore((s) => s.getAnchorOffset);

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
    if (!currentRoom) return;

    const anchorId = getAnchorMessageId(currentRoom.id);

    if (anchorId) return;

    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length]);

  /* ----------------------------------
     Detect user scrolling
     ---------------------------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !currentRoom) return;

    const handleScroll = () => {
      const children = Array.from(el.querySelectorAll("[id^='message-']"));

      for (const child of children) {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();

        if (rect.top >= containerRect.top) {
          const id = Number(child.id.replace("message-", ""));

          setAnchorMessageId(currentRoom.id, id);

          // store exact offset
          const offset = rect.top - containerRect.top;
          setAnchorOffset(currentRoom.id, offset);

          break;
        }
      }

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < AUTO_SCROLL_THRESHOLD_PX;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [currentRoom]);

  // init anchor effect
  useEffect(() => {
    if (!currentRoom) return;

    const anchorId = getAnchorMessageId(currentRoom.id);
    const offset = getAnchorOffset(currentRoom.id);

    if (!anchorId || !containerRef.current) return;

    let attempts = 0;
    const maxAttempts = 5;

    const tryRestore = () => {
      const container = containerRef.current;
      const el = document.getElementById(`message-${anchorId}`);

      if (!container) return;

      if (el) {
        const containerTop = container.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;

        const delta = elTop - containerTop;

        container.scrollTop += delta - offset;
        return; // success → stop retrying
      }

      // retry if element not ready yet
      if (attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(tryRestore);
      }
    };

    requestAnimationFrame(tryRestore);
  }, [currentRoom, messages.length]);

  // restore anchor effect
  useEffect(() => {
    if (!currentRoom || !containerRef.current) return;

    const anchorId = getAnchorMessageId(currentRoom.id);
    const offset = getAnchorOffset(currentRoom.id);

    if (!anchorId) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`message-${anchorId}`);
      const container = containerRef.current;

      if (!el || !container) return;

      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;

      const delta = elTop - containerTop;

      // adjust scroll to match previous offset
      container.scrollTop += delta - offset;
    });
  }, [currentRoom, messages.length]);

  useEffect(() => {
    onRegisterScroll(scrollToMessage);
  }, [onRegisterScroll]);

  //Load older messages
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

  // Loading state
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

export default memo(Messages);
