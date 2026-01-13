import { Outlet, Navigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { useInvitationStore } from "../store/invitationStore";
import InvitationModal from "./invitations/InvitationModal";

const ProtectedLayout = () => {
  const { user } = useAuthStore();
  const invitations = Object.values(useInvitationStore((s) => s.invitations));

  if (!user) {
    return <Navigate to='/auth/login' replace/>
  }

  return (
    <div className="flex flex-col h-full" >
      <InvitationModal invitations={invitations}/>
      
      <div className="flex-1 overflow-hidden bg-background">
        <Outlet />
      </div>
    </div>
  )
};

export default ProtectedLayout;