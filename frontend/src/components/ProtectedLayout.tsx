import { Outlet, Navigate } from "react-router";
import { useAuthStore } from "../store/authStore";
//import ThemeToggle from "./ThemeToggle";

const ProtectedLayout = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to='/auth/login' replace/>
  }

  return (
    <div className="flex flex-col h-full" >
      {/*<div className="flex h-18 items-center justify-end bg-background border-b border-border-line">
        <ThemeToggle />
      </div>*/}
      <div className="flex-1 overflow-hidden bg-background">
        <Outlet />
      </div>
    </div>
  )
};

export default ProtectedLayout;