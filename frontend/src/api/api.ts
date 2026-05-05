const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

export const API = {
  auth: {
    base: `${BASE_URL}/api/auth`,
    login: `${BASE_URL}/api/auth/login`,
    me: `${BASE_URL}/api/auth/me`,
    logout: `${BASE_URL}/api/auth/logout`,
  },
  rooms: `${BASE_URL}/api/rooms`,
  messages: `${BASE_URL}/api/messages`,
  users: `${BASE_URL}/api/users`,
  invitations: `${BASE_URL}/api/invitations`,
};