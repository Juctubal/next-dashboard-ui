import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Password validation only for create or if password is provided in update
    if (type === "create" || (type === "update" && password)) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
    }

    try {
      const endpoint =
        type === "create" ? "/api/staff" : `/api/staff/${data.id}`;
      const method = type === "create" ? "POST" : "PUT";

      const requestBody = {
        firstName,
        lastName,
        username,
        role,
        ...(password && { password }), // Only include password if it's provided
      };

      console.log(`Submitting ${type} form with data:`, requestBody);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.error?.includes("username is taken")) {
          setError(
            "This username is already taken. Please choose another one."
          );
        } else if (
          responseData.error?.includes(
            "password has been found in an online data breach"
          )
        ) {
          setError(
            "This password is too common. Please choose a stronger password."
          );
        } else {
          throw new Error(
            responseData.error || `Failed to ${type} staff member`
          );
        }
        return;
      }

      console.log(`Staff member ${type}d successfully:`, responseData);
      setSuccess(`Staff record successfully ${type}d`);

      // Wait for 2 seconds to show the success message before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error(`Error ${type}ing staff member:`, error);
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${type} staff member`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {type === "create" ? "Add Staff" : "Update Staff"}
      </h2>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded relative">
          {success}
        </div>
      )}
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
        {type === "create" && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Password must be at least 8 characters long and not commonly used.
          </p>
        )}
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
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2 px-4 rounded-md border-none w-max self-center transition-colors"
      >
        {type === "create" ? "Add Staff" : "Update Staff"}
      </button>
    </form>
  );
};

export default StaffForm;
