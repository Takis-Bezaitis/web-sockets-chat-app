import { useState } from "react";
import { type Message } from "../../types/custom";
import { useSocketStore } from "../../store/socketStore";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type MessageActionsProps = {
    userId: number | undefined;
    message: Message;
    onEdit: (e: React.MouseEvent, msg: Message) => void;
};

const MessageActions = ({userId, message, onEdit}: MessageActionsProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const socket = useSocketStore.getState().socket;
  const isSmall = useMediaQuery("(max-width: 768px)");
  
  const handleReactionClick = (emoji: string) => {
    if (!socket) return;

    socket.emit("message:react", {
      emoji,
      userId,
      messageId: message.id,
    });
  };

  const handleDeleteMessage = (id: number, roomId: number) => {
    if (!socket) return;

    socket.emit("message:delete", { id, roomId });
  };

  return (
    <>
      <div 
        className={`absolute flex ${isSmall ? 'gap-2' : 'gap-1'} top-0 right-0 -translate-y-6 secondary-border-line 
        border-1 bg-background p-0.5 rounded-[7px] shadow cursor-pointer`}>
          <div onClick={(e) => {
            e.stopPropagation();
            handleReactionClick("👍");
          }}>
            👍
          </div>

          <div onClick={(e) => {
            e.stopPropagation();
            handleReactionClick("❤️")
          }}>
            ❤️
          </div>

          <div onClick={(e) => { 
            e.stopPropagation();
            handleReactionClick("😄")
          }}>
            😄
          </div>

          {userId === message.userId && (
            <div className="flex gap-1">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(e, message);
                  }}
                >
                  ✏️
                </div>

                <div onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}>
                  🗑
                </div>
            </div>
          )}
      </div>

      {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
          >
            <div
              className="bg-component-background rounded-lg p-4 shadow-lg border border-border-line max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground">
                Delete message?
              </h3>

              <p className="mt-2 text-muted">
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 rounded bg-button-secondary hover:bg-button-secondary-hover cursor-pointer"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-1 rounded bg-button-main text-button hover:bg-button-hover cursor-pointer"
                  onClick={() => {
                    handleDeleteMessage(message.id, message.roomId);
                    setShowDeleteConfirm(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default MessageActions;