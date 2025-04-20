import { useState } from "react";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";

const StaffForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const [firstName, setFirstName] = useState(data?.first_name || "");
  const [lastName, setLastName] = useState(data?.last_name || "");
  const [username, setUsername] = useState(data?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(data?.role || "handler");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const router = useRouter();

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    // Password validation only for create or if password is provided in update
    if (type === "create" || (type === "update" && password)) {
      if (password.length < 8) {
        setNotification({
          message: "Password must be at least 8 characters long",
          type: "error",
        });
        return;
      }
    }

    try {
      const response = await fetch("/api/staff", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          firstName,
          lastName,
          username,
          password: password || undefined,
          role,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save staff record");
      }

      setNotification({
        message: `Staff ${
          type === "create" ? "added" : "updated"
        } successfully`,
        type: "success",
      });

      // Close the modal after a delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("closeModal"));
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving staff record:", error);
      setNotification({
        message: `Failed to ${type} staff record`,
        type: "error",
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {type === "create" ? "Add Staff" : "Update Staff"}
        </h2>
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {type === "create"
              ? "Password"
              : "New Password (leave blank to keep current)"}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required={type === "create"}
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            required
          >
            <option value="handler">Handler</option>
            <option value="breeder">Breeder</option>
          </select>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("closeModal"));
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-6 rounded-md border-none w-max transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {type === "create" ? "Add Staff" : "Update Staff"}
          </button>
        </div>
      </form>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleNotificationClose}
        />
      )}
    </>
  );
};

export default StaffForm;
