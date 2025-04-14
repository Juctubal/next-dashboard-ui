"use client";

import { useState } from "react";
import { ConditioningProgram } from "@prisma/client";

const ConditioningProgramForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: ConditioningProgram;
}) => {
  const [formData, setFormData] = useState({
    programName: data?.programName || "",
    description: data?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        {type === "create" ? "Create" : "Update"} Conditioning Program
      </h2>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="programName"
          className="font-medium text-gray-700 dark:text-gray-300"
        >
          Program Name
        </label>
        <input
          type="text"
          id="programName"
          value={formData.programName}
          onChange={(e) =>
            setFormData({ ...formData, programName: e.target.value })
          }
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="description"
          className="font-medium text-gray-700 dark:text-gray-300"
        >
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-ggPurple dark:focus:ring-ggPurple/70 focus:border-transparent transition-colors"
          rows={4}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-ggPurple text-white py-2 px-4 rounded-md border-none w-max self-end hover:bg-ggPurple/90 transition-colors"
      >
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ConditioningProgramForm;
