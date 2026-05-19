import { API } from "./api";
import { useAuthStore } from "../store/authStore";

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const { token, setToken, setUser, logout } = useAuthStore.getState();

  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");

  let response = await fetch(input, {
    ...init,
    headers,
  });
console.log("API STATUS:", response.status);
  // accessToken expired
  if (response.status === 401) {
    const refreshRes = await fetch(API.auth.refresh, {
      method: "POST",
      credentials: "include",
    });

    // refreshToken expired too
    if (!refreshRes.ok) {
      logout();
      window.location.href = "/auth/login";
      throw new Error("Session expired");
    }

    const refreshData = await refreshRes.json();

    setToken(refreshData.token);
    setUser(refreshData.user);

    // retry original request with new token
    headers.set("Authorization", `Bearer ${refreshData.token}`);

    response = await fetch(input, {
      ...init,
      headers,
    });
  }

  return response;
}
