import { useEffect, useRef, useState } from "react";
import { useSocketStore } from "../../store/socketStore";
import { useMessageStore } from "../../store/messageStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { type Message, type User } from "../../types/custom";
import { formatDate } from "../../utils/formatDate";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import EmojiPicker from "./EmojiPicker";
import ReplyConnectorSVG from "./ReplyConnectorSVG";

type MessageItemProps = {
  message: Message;
  user: User | null;
  ensureVisible: (id: number) => void;
};

const MessageItem = ({ message, user, ensureVisible }: MessageItemProps) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const socket = useSocketStore.getState().socket;
  const setReplyingTo = useMessageStore((s) => s.setReplyingTo);
  const editTextRef = useRef<HTMLInputElement | null>(null);

  const isSmall = useMediaQuery("(max-width: 768px)");
  
  const submitEdit = (messageId: number, roomId: number) => {
    if (!socket) return;

    if (!editingText.trim() || editingText === message.text) {
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
    setIsEmojiPickerOpen(false);
    if (isSmall) {
      setHoveredMessageId(null);
    }
  };

  const updateMessage = (emoji: string) => {
    const newValue = editingText + emoji;
    setEditingText(newValue);
    if (editTextRef.current && !isSmall) {
      editTextRef.current?.focus();
    }
    if (isSmall) {
      setHoveredMessageId(null);
    }
  };

  const handleMessageClick = () => {
    if (!isSmall) return;

    setHoveredMessageId((prev) =>
      prev === message.id ? null : message.id
    );
  };

  useEffect(() => {
    if (
      editingMessageId === message.id &&
      editTextRef.current &&
      !isSmall
    ) {
      editTextRef.current.focus();
    }
  }, [editingMessageId, isSmall, message.id]);

  return (
    <div className="mb-14" key={message.id} >
      <div
        id={`message-${message.id}`}
        className={`relative flex gap-2 max-w-fit text-left 
          ${message.replyToId ? 'mt-0' : 'mt-6'}
          ${message.replies && message?.replies.length > 0 ? 'mb-6' : 'mb-11'}  
          px-3 py-2 rounded ${
          message.userId === user?.id
            ? "bg-message-user"
            : "bg-message-other-user"
        }`}
        onMouseEnter={() => {
          if (!isSmall) {
            setHoveredMessageId(message.id);
          }
        }}
        onMouseLeave={() => {
          if (!isSmall) {
            setHoveredMessageId(null);
          }
        }}
        onClick={handleMessageClick}
      >
        {hoveredMessageId === message.id && (
          <MessageActions
            userId={user?.id}
            message={message}
            onEdit={(_, m) => {
              setEditingMessageId(m.id);
              setEditingText(m.text);

              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  ensureVisible(m.id);
                });
              });
            }}
          />
        )}

        <div className="text-3xl">👤</div>

        <div>
          <div>
            <span className="font-semibold">
              {message.userId === user?.id ? "You" : message.username}
            </span>{" "}
            {formatDate(message.createdAt)}

            {editingMessageId === message.id &&
              <span
                  className="cursor-pointer ml-3.5"
                  onClick={(e) => {
                    e.stopPropagation();

                    const next = !isEmojiPickerOpen;
                    setIsEmojiPickerOpen(next);

                    if (next) {
                      requestAnimationFrame(() => {
                        ensureVisible(message.id);
                      });
                    }

                    if (editTextRef.current && !isSmall) {
                      editTextRef.current?.focus();
                    }
                  }}
                >😀
              </span>
            }
          </div>

          {editingMessageId === message.id ? (
            <>
              <input
                ref={editTextRef}
                className="w-full bg-transparent outline-none border p-2 rounded-md"
                value={editingText}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitEdit(message.id, message.roomId);
                  if (e.key === "Escape") cancelEdit();
                }}
                
              />

              {isEmojiPickerOpen && 
                <div className="my-1 z-71">
                  <EmojiPicker textSelect={updateMessage} />
                </div>
              }

              <p className="mt-2 text-sm text-white">
                escape to <button
                    className="cursor-pointer font-bold text-sky-950 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                  >
                    cancel
                  </button> - enter to <button 
                    className="cursor-pointer font-bold text-sky-950 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      submitEdit(message.id, message.roomId);
                    }}
                  >
                    save
                  </button>
              </p>
            </>
          ) : (
            <div>{message.text}</div>
          )}
        </div>

        {message.reactions.length > 0 && (
          <MessageReactions reactions={message.reactions ?? []} />
        )}

        <div 
          className="absolute right-1 bottom-[-19px] text-sm text-foreground hover:opacity-80 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();

            if (!message.roomId) return;
            setReplyingTo(message.roomId, message);
          }}
        >
          Reply
        </div>
      </div>
      
      {message.replies?.map((reply) => (
        <div key={reply.id}>
          {reply.replyTo && (
            <div className="flex gap-1 items-start text-foreground">
              <div className="mt-2 ml-2">
                <ReplyConnectorSVG />
              </div>
              <div className="text-sm">
                replying to {reply.replyTo.username}: {reply.replyTo.text}
              </div>
            </div>
          )}
          <MessageItem message={reply} user={user} ensureVisible={ensureVisible} />
        </div>
      ))} 

    </div>
  );
};

export default MessageItem;