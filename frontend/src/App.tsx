import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { routes } from "./routes/routes";
import { Suspense } from "react";
import { useAuthStore } from "./store/authStore";
import { useInvitations } from "./hooks/useInvitationsSockets";
import { Toaster } from "react-hot-toast";
import OrientationGuard from "./components/layout/OrientationGuard";
import LoadingScreen from "./components/common/LoadingScreen";

function App() {
  const { checkAuth, user } = useAuthStore();
  const { fetchInvitations } = useInvitations();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <OrientationGuard />
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          duration: 2000,
        }}
      />
      <RouterProvider router={routes} />
    </Suspense>
  );
}

export default App;
