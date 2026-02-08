import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check saved preference first
    const stored = localStorage.getItem("sockets-chat-theme");
    if (stored === "light" || stored === "dark") return stored;

    // Otherwise match system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  // Apply theme to <html> tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    localStorage.setItem("sockets-chat-theme", theme);
  }, [theme]);

  return (
    <div
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="mt-0.5 cursor-pointer"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </div>
  );
};

export default ThemeToggle;
