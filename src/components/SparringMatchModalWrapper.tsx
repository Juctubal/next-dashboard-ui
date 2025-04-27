"use client";

import { useState, useEffect } from "react";
import SparringMatchModal from "./modals/SparringMatchModal";

export default function SparringMatchModalWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sparringId, setSparringId] = useState<number | null>(null);

  useEffect(() => {
    // Listen for the custom event to open the modal
    const handleOpenModal = (event: CustomEvent) => {
      const { sparringId } = event.detail;
      setSparringId(sparringId);
      setIsModalOpen(true);
    };

    // Add event listener
    document.addEventListener(
      "openSparringMatchModal",
      handleOpenModal as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "openSparringMatchModal",
        handleOpenModal as EventListener
      );
    };
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isModalOpen || !sparringId) {
    return null;
  }

  return (
    <SparringMatchModal sparringId={sparringId} onClose={handleCloseModal} />
  );
}
