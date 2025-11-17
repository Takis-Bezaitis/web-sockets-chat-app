import { Navigate } from "react-router";
import { useAuthStore } from "../store/authStore.js";

const IndexRedirect = () => {
    const { user } = useAuthStore();
    return user ? <Navigate to="/chat" replace /> : <Navigate to="/auth/login" replace />;
}

export default IndexRedirect