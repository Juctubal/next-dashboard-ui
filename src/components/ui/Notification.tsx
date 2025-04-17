"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface NotificationProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

const Notification = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px] max-w-md transform transition-all duration-300 ${
        type === "success"
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      <div className="flex-1">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-black/10 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;
