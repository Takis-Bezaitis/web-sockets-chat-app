import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useUsersStore } from "../../store/usersStore";

type RoomMembersInviteProps = {
    inviteRoomId: number;
    roomName: string;
    mode: 'create' | 'manage';
    onClose?: () => void;
    onCloseInviteMembers: () => void;
}

const RoomMembersInvite = ({inviteRoomId, roomName, mode, onClose, onCloseInviteMembers}: RoomMembersInviteProps) => {
    const { user } = useAuthStore();
    const [invites, setInvites] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const users = useUsersStore((s) => s.users);
    const hasValidInput = invites.split(/[\s,]+/).some((t) => t.trim().length > 0);

    const INVITATIONS_BASE_URL = import.meta.env.VITE_BACKEND_INVITATIONS_BASE_URL;

    if (!inviteRoomId) {
        return (
            <div className="text-red-500">
            Failed to load room. Please close and try again.
            </div>
        );
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError("");

        try {
            let inviteeIds: number[] = [];

            if (invites.trim()) {
                // Split by spaces or commas, remove empty entries
                const names = invites
                .split(/[\s,]+/)
                .map((n) => n.replace("@", "").trim())
                .filter((n) => n.length > 0);

                // Map to user IDs using users from the store
                inviteeIds = names
                .map((n) => users.find((u) => u.username.toLowerCase() === n.toLowerCase()))
                .filter((u): u is { id: number, username: string } => !!u) // filter out undefined
                .map((u) => u.id);
                
                inviteeIds = Array.from(new Set(inviteeIds));
                inviteeIds = inviteeIds.filter((id) => id !== user?.id);
            }

            if (inviteeIds.length > 0) {
                const newRoomId = inviteRoomId;

                const res = await fetch(`${INVITATIONS_BASE_URL}`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId: newRoomId,
                        inviteeIds
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Some invitations failed.");
                }
            }

            if (mode==="create") {
                onClose?.();
            } else {
                onCloseInviteMembers();
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
    }

    return (
        <div className="bg-create-room text-foreground rounded-lg w-lg m-5 p-5 shadow-lg">
            <div className="flex justify-end">
                <span className="cursor-pointer" onClick={onCloseInviteMembers}>✖</span>
            </div>
            <h2 className="text-lg font-semibold mb-4">Add members to #{roomName}</h2>

            <label className="block relative mb-4">
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

                <input
                    type="text"
                    autoFocus
                    value={invites}
                    onChange={(e) => setInvites(e.target.value)}
                    placeholder="ex. Juliet"
                    className="w-full border rounded px-3 py-2"
                />

                {(() => {
                const lastPartial = invites.split(/[\s,]+/).pop()?.trim().replace("@", "").toLowerCase() || "";
                const suggestions = lastPartial
                    ? users.filter((u) => u.username.toLowerCase().startsWith(lastPartial))
                    : [];

                if (suggestions.length === 0) return null; 

                return (
                    <ul className="absolute w-full bg-surface mt-4 border rounded h-11 overflow-auto text-sm">
                    {suggestions.map((u) => (
                        <li
                            key={u.id}
                            className="w-fit ml-0.5 mt-0.5 h-[2.4rem] px-3 py-2 bg-member-invite rounded cursor-pointer"
                            onClick={() => {
                                const parts = invites.split(/[\s,]+/);
                                parts[parts.length - 1] = `@${u.username}`;
                                setInvites(parts.join(", ") + ", ");
                            }}
                            >
                            @{u.username}
                        </li>
                    ))}
                    </ul>
                );
                })()}
            </label>

            
            <div className="flex justify-end gap-2">
                {mode==="create" && (
                    <button
                        onClick={onCloseInviteMembers}
                        className="w-24 px-4 py-2 rounded bg-button-secondary hover:bg-button-secondary-hover cursor-pointer"
                    >
                        Back
                    </button>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !roomName.trim()}
                    className="w-24 px-4 py-2 rounded bg-button-main text-white hover:bg-button-hover cursor-pointer"
                >
                    {!hasValidInput ? 'Skip' : mode === "create" ? 'Create' : 'Invite'}
                </button>
            </div>

        </div>
    )
}

export default RoomMembersInvite;