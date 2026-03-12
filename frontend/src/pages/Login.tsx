import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  // Demo accounts for recruiters
  const DEMO_PASSWORD = "MySecret123!";

  const demoUsers = [
    { username: "Alice", email: "alice@example.com" },
    { username: "Markos", email: "markos@example.com" },
    { username: "Simon", email: "simon@example.com" },
    { username: "Bob", email: "bob@example.com" },
    { username: "Mary", email: "mary@example.com" },
    { username: "Manos", email: "manos@example.com" },
    { username: "Effie", email: "effie@example.com" },
    { username: "John", email: "john@example.com" }
  ];

  const loginAsDemoUser = async (email: string) => {
    setDemoLoading(email);
    await handleSubmit(undefined, email, DEMO_PASSWORD);
    setDemoLoading(null);
  };

  const handleSubmit = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
    e?.preventDefault();

    const loginEmail = demoEmail ?? email;
    const loginPassword = demoPassword ?? password;

    try {
      console.log(email, password)
      const res = await fetch(`${import.meta.env.VITE_BACKEND_AUTH_LOGIN_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, }),
        credentials: "include", 
      });

      const data = await res.json();
      console.log(data)

      if (!res.ok) {
        if (data.errors) {
          data.errors.forEach((err: { message: string }) =>
            toast.error(err.message)
          );
        } else if (data.error || data.message) {
          toast.error(data.error || data.message);
        } else {
          toast.error("Something went wrong");
        }
        return;
      }

      setUser({ id: data.id, email: data.email, username: data.username });
      navigate("/chat");
    } catch (err) {
      setError("Server error");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm"
      >
        <h1 className="text-2xl mb-6 text-center">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <label className="block mb-2">
          Email
          <input
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </label>

        <label className="block mb-4">
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </label>

        <Button type="submit" fullWidth>
          Login
        </Button>
      </form>

      <p className="text-center text-lg mt-8 mb-3">
        Demo accounts
      </p>

      <div className="grid grid-cols-2 gap-3 mt-2">
        {demoUsers.map((user) => (
          <Button 
            key={user.email}
            onClick={() => loginAsDemoUser(user.email)}
            disabled={demoLoading !== null}
          >
            {demoLoading === user.email
            ? "Logging in..."
            : `Login as ${user.username}`}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Login;
