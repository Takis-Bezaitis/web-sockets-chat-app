import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_AUTH_LOGIN_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // send/receive cookies
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          data.errors.forEach((err: { message: string }) => toast.error(err.message));
        } else if (data.error) {
          toast.error(data.error);
        }
        return;
      }

      // Backend already sets cookie with JWT
      setUser({ id: data.id, email: data.email, username: data.username });
      navigate("/chat");
    } catch (err) {
      setError("Server error");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl mb-6 text-center">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label className="block mb-2">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <label className="block mb-4">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
