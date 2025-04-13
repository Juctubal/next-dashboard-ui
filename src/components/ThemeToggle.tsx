"use client";

import { useTheme } from "./ThemeProvider";
import Image from "next/image";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Image src="/moon.svg" alt="Dark mode" height={16} width={16} />
      ) : (
        <Image src="/sun.svg" alt="Light mode" height={16} width={16} />
      )}
    </button>
  );
}
