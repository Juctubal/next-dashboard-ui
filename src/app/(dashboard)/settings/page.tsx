"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Appearance
        </h2>

        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {theme === "light" ? (
                <Image src="/sun.svg" alt="Light mode" height={20} width={20} />
              ) : (
                <Image src="/moon.svg" alt="Dark mode" height={20} width={20} />
              )}
            </div>
            <div>
              <h3 className="font-medium dark:text-white">Theme</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {theme === "light" ? "Light mode" : "Dark mode"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium dark:text-white"
          >
            {theme === "light" ? "Switch to Dark" : "Switch to Light"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Manage your account settings and preferences.
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium">
          Edit Profile
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Notifications
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Configure your notification preferences.
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium">
          Manage Notifications
        </button>
      </div>
    </div>
  );
}
