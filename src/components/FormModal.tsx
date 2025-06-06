"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";
import StaffForm from "./forms/StaffForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const GamefowlForm = dynamic(() => import("./forms/GamefowlForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ConditioningProgramForm = dynamic(
  () => import("./forms/ConditioningProgramForm"),
  {
    loading: () => <h1>Loading...</h1>,
  }
);
const ConditioningForm = dynamic(() => import("./forms/ConditioningForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SparringForm = dynamic(() => import("./forms/SparringForm"), {
  loading: () => <h1>Loading...</h1>,
});
const BreedingForm = dynamic(() => import("./forms/BreedingForm"), {
  loading: () => <h1>Loading...</h1>,
});
const MedicalForm = dynamic(() => import("./forms/MedicalForm"), {
  loading: () => <h1>Loading...</h1>,
});
const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ScheduleForm = dynamic(() => import("./forms/ScheduleForm"), {
  loading: () => <h1>Loading...</h1>,
});
const IncubationForm = dynamic(() => import("./forms/IncubationForm"), {
  loading: () => <h1>Loading...</h1>,
});

const FormModal = ({
  table,
  type,
  data,
  id,
}: {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "vaccine"
    | "deworming"
    | "vitamin"
    | "medicine"
    | "staff"
    | "gamefowl"
    | "conditioningProgram"
    | "conditioning"
    | "sparring"
    | "breeding"
    | "schedule"
    | "incubation";
  type: "create" | "update" | "delete" | "archive" | "unarchive";
  data?: any;
  id?: number | String;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-ggYellow"
      : type === "update"
      ? "bg-ggSky hover:bg-ggSky/80 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
      : type === "archive" || type === "unarchive"
      ? "bg-ggPurple hover:bg-ggPurple/80 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
      : "bg-ggPurple";

  const [open, setOpen] = useState(false);
  const [staffData, setStaffData] = useState<any>(data);

  const handleClose = () => {
    setOpen(false);
  };

  // Listen for closeModal event
  useEffect(() => {
    const handleCloseModal = () => {
      setOpen(false);
    };

    window.addEventListener("closeModal", handleCloseModal);

    return () => {
      window.removeEventListener("closeModal", handleCloseModal);
    };
  }, []);

  // Fetch staff data when modal is opened for update operation
  useEffect(() => {
    const fetchStaffData = async () => {
      if (open && type === "update" && table === "staff" && id) {
        try {
          const response = await fetch(`/api/staff/${id}`);
          if (response.ok) {
            const data = await response.json();
            setStaffData(data);
          } else {
            console.error("Failed to fetch staff data");
          }
        } catch (error) {
          console.error("Error fetching staff data:", error);
        }
      }
    };

    fetchStaffData();
  }, [open, type, table, id]);

  const Form = () => {
    if (type === "delete") {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Are you sure you want to delete this {table}?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle delete
                handleClose();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      );
    }

    if (type === "archive" || type === "unarchive") {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Are you sure you want to {type} this {table}?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {type === "archive"
              ? "This record will be moved to the archive."
              : "This record will be restored to active records."}
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle archive/unarchive
                handleClose();
              }}
              className="px-4 py-2 bg-ggPurple text-white rounded-md hover:bg-ggPurple/90 transition-colors"
            >
              {type === "archive" ? "Archive" : "Unarchive"}
            </button>
          </div>
        </div>
      );
    }

    // Return the appropriate form component with the fetched data
    switch (table) {
      case "staff":
        return (
          <StaffForm
            type={type}
            data={{ ...staffData, id: staffData?.id || id }}
          />
        );
      case "teacher":
        return <TeacherForm type={type} data={staffData} />;
      case "student":
        return <StudentForm type={type} data={staffData} />;
      case "gamefowl":
        return <GamefowlForm type={type} data={staffData} />;
      case "conditioningProgram":
        return (
          <ConditioningProgramForm
            type={type}
            data={staffData}
            onClose={handleClose}
          />
        );
      case "conditioning":
        return (
          <ConditioningForm
            type={type}
            data={staffData}
            onClose={handleClose}
          />
        );
      case "sparring":
        return (
          <SparringForm
            type={type}
            data={staffData}
            gamefowls={staffData?.gamefowls || []}
            onClose={handleClose}
          />
        );
      case "breeding":
        return <BreedingForm type={type} data={staffData} />;
      case "vaccine":
        return (
          <MedicalForm
            type={type}
            data={staffData}
            recordType="vaccine"
            onClose={handleClose}
          />
        );
      case "deworming":
        return (
          <MedicalForm
            type={type}
            data={staffData}
            recordType="deworming"
            onClose={handleClose}
          />
        );
      case "vitamin":
        return (
          <MedicalForm
            type={type}
            data={staffData}
            recordType="vitamin"
            onClose={handleClose}
          />
        );
      case "medicine":
        return (
          <MedicalForm
            type={type}
            data={staffData}
            recordType="medicine"
            onClose={handleClose}
          />
        );
      case "event":
        return <EventForm type={type} data={staffData} />;
      case "schedule":
        return <ScheduleForm type={type} data={staffData} />;
      case "incubation":
        return (
          <IncubationForm
            type={type}
            data={staffData}
            onClose={handleClose}
            breedingId={staffData?.breedingId}
          />
        );
      default:
        return <div>Form not found</div>;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${size} ${bgColor} rounded-full flex items-center justify-center`}
      >
        <Image
          src={
            type === "create"
              ? "/create.png"
              : type === "update"
              ? "/update.png"
              : type === "delete"
              ? "/delete.png"
              : type === "archive"
              ? "/archive.png"
              : "/unarchive.png"
          }
          alt=""
          width={16}
          height={16}
        />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              {table !== "breeding" && (
                <h2 className="text-xl font-semibold dark:text-white">
                  {type === "create"
                    ? "Create"
                    : type === "update"
                    ? "Update"
                    : type === "delete"
                    ? "Delete"
                    : type === "archive"
                    ? "Archive"
                    : "Unarchive"}{" "}
                  {table}
                </h2>
              )}
              <button
                onClick={handleClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <Form />
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
