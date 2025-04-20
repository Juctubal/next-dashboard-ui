"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Notification from "../ui/Notification";

const schema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  email: z.string().email({ message: "Invalid email address!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.date({ message: "Birthday is required!" }),
  sex: z.enum(["male", "female"], { message: "Sex is required!" }),
  img: z.instanceof(File, { message: "Image is required!" }),
});

type Inputs = z.infer<typeof schema>;

const AnnouncementForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const router = useRouter();

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch("/api/announcement", {
        method: type === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data?.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save announcement");
      }

      setNotification({
        message: `Announcement ${
          type === "create" ? "created" : "updated"
        } successfully`,
        type: "success",
      });

      // Close the modal after a delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("closeModal"));
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving announcement:", error);
      setNotification({
        message: `Failed to ${type} announcement`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      <form className="flex flex-col gap-8" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold">Create a new Announcement</h1>
        <span className="text-xs text-gray-400 font-medium">
          Authenticaton Information
        </span>
        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="Username"
            name="username"
            defaultValue={data?.username}
            register={register}
            error={errors?.username}
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            defaultValue={data?.email}
            register={register}
            error={errors?.email}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            defaultValue={data?.password}
            register={register}
            error={errors?.password}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Personal Information
        </span>
        <div className="flex justify-between flex-wrap gap-4">
          <InputField
            label="First Name"
            name="firstName"
            defaultValue={data?.firstName}
            register={register}
            error={errors?.firstName}
          />
          <InputField
            label="Last Name"
            name="lastName"
            defaultValue={data?.lastName}
            register={register}
            error={errors?.lastName}
          />
          <InputField
            label="Phone"
            name="phone"
            defaultValue={data?.phone}
            register={register}
            error={errors?.phone}
          />
          <InputField
            label="Address"
            name="address"
            defaultValue={data?.address}
            register={register}
            error={errors?.address}
          />
          <InputField
            label="Blood Type"
            name="bloodType"
            defaultValue={data?.bloodType}
            register={register}
            error={errors?.bloodType}
          />
          <InputField
            label="Birthday"
            name="birthday"
            defaultValue={data?.birthday}
            register={register}
            error={errors?.birthday}
            type="date"
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4 ">
            <label className="text-xs text-gray-500">Sex</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("sex")}
              defaultValue={data?.sex}
            >
              <option value="male">Male</option>
              <option value="male">Female</option>
            </select>
            {errors.sex?.message && (
              <p className="text-xs text-red-400">
                {errors.sex.message.toString()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label
              className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
              htmlFor="img"
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload a photo</span>
            </label>
            <input
              type="file"
              id="img"
              {...register("img")}
              className="hidden"
            />
            {errors.img?.message && (
              <p className="text-xs text-red-400">
                {errors.img.message.toString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4">
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
            disabled={isSubmitting}
            className="bg-blue-400 hover:bg-blue-500 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {type === "create" ? "Creating..." : "Updating..."}
              </>
            ) : type === "create" ? (
              "Create"
            ) : (
              "Update"
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

export default AnnouncementForm;
