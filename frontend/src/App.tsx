import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { routes } from "./routes/routes";
import { Suspense } from "react";
import { useAuthStore } from "./store/authStore";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={routes} />
    </Suspense>
  );
}

export default App;
