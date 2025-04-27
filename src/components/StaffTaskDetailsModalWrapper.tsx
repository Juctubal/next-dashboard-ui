"use client";

import { useState, useEffect } from "react";
import StaffTaskDetailsModal from "./modals/StaffTaskDetailsModal";

export default function StaffTaskDetailsModalWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Listen for the custom event to open the modal
    const handleOpenModal = (event: CustomEvent) => {
      const { taskId } = event.detail;
      setTaskId(taskId);
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
  };

  if (!isModalOpen || !taskId) {
    return null;
  }

  return <StaffTaskDetailsModal taskId={taskId} onClose={handleCloseModal} />;
}
