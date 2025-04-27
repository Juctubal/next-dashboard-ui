"use client";

import { useState, useEffect } from "react";
import TaskDetailsModal from "./modals/TaskDetailsModal";

export default function TaskDetailsModalWrapper() {
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
      "openTaskDetailsModal",
      handleOpenModal as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "openTaskDetailsModal",
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

  return <TaskDetailsModal taskId={taskId} onClose={handleCloseModal} />;
}
