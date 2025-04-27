import { useState } from "react";
import { useRouter } from "next/navigation";
import Notification from "../ui/Notification";
import { useUser } from "@clerk/nextjs";

const StaffForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [firstName, setFirstName] = useState(data?.first_name || "");
  const [lastName, setLastName] = useState(data?.last_name || "");
  const [username, setUsername] = useState(data?.username || "");
  const [email, setEmail] = useState(data?.email || "");
  const [phone, setPhone] = useState(data?.phone || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(data?.role || "handler");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate password for create type
    if (type === "create" && (!password || password.length < 6)) {
      setNotification({
        message: "Password must be at least 6 characters long",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Add a delay to match event creation loading time
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Use different endpoints for create and update
      const endpoint =
        type === "create" ? "/api/staff" : `/api/staff/${data?.id}`;

      console.log("Submitting to endpoint:", endpoint);
      console.log("Data being sent:", {
        id: data?.id,
        firstName,
        lastName,
        username,
        email,
        phone,
        password: type === "create" ? password : undefined,
        role,
      });

      const response = await fetch(endpoint, {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          firstName,
          lastName,
          username,
          email,
          phone,
          password: type === "create" ? password : undefined,
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
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${type} staff record`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
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
        {type === "create" && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
            />
          </div>
        )}
        {type === "update" && (
          <>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              />
            </div>
          </>
        )}
        {isAdmin && (
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
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("closeModal"))}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {type === "create" ? "Adding..." : "Updating..."}
              </div>
            ) : type === "create" ? (
              "Add Staff"
            ) : (
              "Update Staff"
            )}
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
