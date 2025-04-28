"use client";

import { useState, useEffect } from "react";
import StaffTaskDetailsModal from "./modals/StaffTaskDetailsModal";

export default function StaffTaskDetailsModalWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskDate, setTaskDate] = useState<string | null>(null);

  useEffect(() => {
    // Listen for the custom event to open the modal
    const handleOpenModal = (event: CustomEvent) => {
      const { taskId, taskDate } = event.detail;
      setTaskId(taskId);
      setTaskDate(taskDate);
      setIsModalOpen(true);
    };

    // Add event listener
    document.addEventListener(
      "openStaffTaskDetailsModal",
      handleOpenModal as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "openStaffTaskDetailsModal",
        handleOpenModal as EventListener
      );
    };
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTaskDate(null);
  };

  if (!isModalOpen || !taskId) {
    return null;
  }

  return (
    <StaffTaskDetailsModal
      taskId={taskId}
      taskDate={taskDate || undefined}
      onClose={handleCloseModal}
    />
  );
}
