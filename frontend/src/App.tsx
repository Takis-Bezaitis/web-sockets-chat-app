import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { routes } from "./routes/routes";
import { Suspense } from "react";
import { useAuthStore } from "./store/authStore";
import { useInvitations } from "./hooks/useInvitationsSockets";

function App() {
  const { checkAuth, user } = useAuthStore();
  const { fetchInvitations } = useInvitations();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={routes} />
    </Suspense>
  );
}

export default App;
