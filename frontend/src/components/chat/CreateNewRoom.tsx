import { useState } from "react";
import RoomMembersInvite from "../invitations/RoomMembersInvite";
import type { RoomDTO } from "../../types/custom";

type CreateNewRoomProps = {
  onClose: () => void;
};

const CreateNewRoom = ({ onClose }: CreateNewRoomProps) => {
  const [name, setName] = useState<string>("");
  const [newRoom, setNewRoom] = useState<RoomDTO>();
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteMembersVisible, setInviteMembersVisible] = useState<boolean>(false);
  const [error, setError] = useState("");
  
  const ROOMS_BASE_URL = import.meta.env.VITE_BACKEND_ROOMS_BASE_URL;

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${ROOMS_BASE_URL}/create-room`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          isPrivate
        }),
      });

      const newCreatedRoom = await res.json();
      setNewRoom(newCreatedRoom.data)

      if (!res.ok) {
        throw new Error(newCreatedRoom.error || "Failed to create room.");
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        console.error("Failed to create room:", err);
      }
    } finally {
      setIsSubmitting(false);
    }

    if (isPrivate) {
      setInviteMembersVisible(true);
    } else {
      onClose();
    }

  };

  const closeInviteMembers = async () => {
    setInviteMembersVisible(false);
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${ROOMS_BASE_URL}/${newRoom?.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const deletedRoom = await res.json();

      if (!res.ok) {
        throw new Error(deletedRoom.error || "Failed to delete the room.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        console.error("Failed to create room:", err);
      }
    } finally {
      setIsSubmitting(false);
    }

    setName("");
    setNewRoom(undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]">
      {inviteMembersVisible && newRoom ? (
        <RoomMembersInvite inviteRoomId={newRoom.id} roomName={name} mode='create' onClose={onClose} onCloseInviteMembers={closeInviteMembers} />
      ) : (
      <div className="bg-create-room text-foreground rounded-lg w-96 p-5 shadow-lg">
        <div className="flex justify-end">
          <span className="cursor-pointer" onClick={onClose}>✖</span>
        </div>
        
        <h2 className="text-lg font-semibold mb-4">Create New Room</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Room name"
          className="w-full border rounded px-3 py-2 mb-4"
        />

        {/* Private toggle */}
        <label className="flex justify-between items-center gap-3 mb-3 cursor-pointer">
          <span className="text-sm flex items-center gap-1">
            🔒 Private room
          </span>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={() => setIsPrivate((v) => !v)}
            className="sr-only"
          />

          <div
            className={`w-10 h-5 rounded-full transition-colors ${
              isPrivate ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
                isPrivate ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        <div className="mb-3">
          By making a channel private, only select users will be able to view this channel.
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="w-24 px-4 py-2 rounded bg-button-secondary hover:bg-button-secondary-hover cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="w-24 px-4 py-2 rounded bg-button-main text-white hover:bg-button-hover cursor-pointer"
          >
            {isPrivate ? 'Next' : 'Create'}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default CreateNewRoom;
