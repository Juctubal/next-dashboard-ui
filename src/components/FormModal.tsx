"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
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

const forms: {
  [key: string]: (type: "create" | "update", data?: any) => JSX.Element;
} = {
  teacher: (type, data) => <TeacherForm type={type} data={data} />,
  student: (type, data) => <StudentForm type={type} data={data} />,
  staff: (type, data) => <StaffForm type={type} data={data} />,
  gamefowl: (type, data) => <GamefowlForm type={type} data={data} />,
  conditioningProgram: (type, data) => (
    <ConditioningProgramForm type={type} data={data} />
  ),
  conditioning: (type, data) => <ConditioningForm type={type} data={data} />,
};

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
    | "staff"
    | "gamefowl"
    | "conditioningProgram"
    | "conditioning";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | String;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-ggYellow"
      : type === "update"
      ? "bg-ggSky"
      : "bg-ggPurple";

  const [open, setOpen] = useState(false);

  const Form = () => {
    return type === "delete" && id ? (
      <form action="" className="p-4 flex flex-col gap-4">
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
          Delete
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](type, data)
    ) : (
      "Form not found!"
    );
  };
  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
