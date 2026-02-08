import { useInvitations } from "../../hooks/useInvitationsSockets";
import type { InvitationDTO } from "../../types/custom";

type InvitationModalProps = {
  invitations: InvitationDTO[];
};

const InvitationModal = ({ invitations }: InvitationModalProps) => {
  const { acceptInvitation, declineInvitation } = useInvitations();

  if (invitations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface text-foreground rounded-lg shadow-xl w-96 p-4">
        <h2 className="text-lg font-semibold mb-3">Room Invitations</h2>

        <div className="space-y-3">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="justify-between items-center border rounded p-2"
            >
              <div className="text-md">
                You were invited by <strong>{inv.inviter.username}</strong> to{" "}
                <strong>#{inv.room.name}</strong>
              </div>

              <div className="flex justify-end gap-2 mt-3 mb-1">
                <button
                  onClick={() => acceptInvitation(inv.id, inv.room.id)}
                  className="px-4 py-2 bg-button-main text-white rounded hover:bg-button-hover cursor-pointer"
                >
                  Accept
                </button>

                <button
                  onClick={() => declineInvitation(inv.id)}
                  className="px-4 py-2 bg-button-secondary text-white hover:bg-button-secondary-hover rounded cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvitationModal;
