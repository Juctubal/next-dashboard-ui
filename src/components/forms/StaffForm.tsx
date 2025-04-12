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
  const [role, setRole] = useState(data?.role || "HANDLER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      console.log("Submitting form with data:", {
        firstName,
        lastName,
        username,
        role,
      });

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("username is taken")) {
          setError(
            "This username is already taken. Please choose another one."
          );
        } else if (
          data.error?.includes(
            "password has been found in an online data breach"
          )
        ) {
          setError(
            "This password is too common. Please choose a stronger password."
          );
        } else {
          throw new Error(data.error || "Failed to create staff member");
        }
        return;
      }

      console.log("Staff member created successfully:", data);
      setSuccess("Staff record successfully created");

      // Wait for 2 seconds to show the success message before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error creating staff member:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create staff member"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {type === "create" ? "Add Staff" : "Update Staff"}
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700"
        >
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700"
        >
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Password must be at least 8 characters long and not commonly used.
        </p>
      </div>
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="HANDLER">Handler</option>
          <option value="BREEDER">Breeder</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-indigo-600 text-white py-2 px-4 rounded-md border-none w-max self-center"
      >
        {type === "create" ? "Add Staff" : "Update Staff"}
      </button>
    </form>
  );
};

export default StaffForm;
