import { Outlet, Navigate } from "react-router";
import { useAuthStore } from "../store/authStore";

const AuthLayout = () => {
  const { user } = useAuthStore();

  if (user) {
    // If already logged in, don't allow access to /auth/*
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
