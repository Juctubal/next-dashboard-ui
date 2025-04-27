"use client";

import { useState, useEffect } from "react";
import GamefowlSparringModal from "./modals/GamefowlSparringModal";

interface SparringMatch {
  id: number;
  sparringDate: Date;
  gamefowl1: {
    id: number;
    name: string;
    img: string | null;
  };
  gamefowl2: {
    id: number;
    name: string;
    img: string | null;
  };
  winner: {
    id: number;
    name: string;
  } | null;
  loser: {
    id: number;
    name: string;
  } | null;
}

export default function GamefowlSparringModalWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gamefowlId, setGamefowlId] = useState<number | null>(null);
  const [gamefowlName, setGamefowlName] = useState<string>("");
  const [sparringMatches, setSparringMatches] = useState<SparringMatch[]>([]);

  useEffect(() => {
    // Listen for the custom event to open the modal
    const handleOpenModal = (event: CustomEvent) => {
      const { gamefowlId, gamefowlName, sparringMatches } = event.detail;
      setGamefowlId(gamefowlId);
      setGamefowlName(gamefowlName);
      setSparringMatches(sparringMatches);
      setIsModalOpen(true);
    };

    // Add event listener
    document.addEventListener(
      "openSparringModal",
      handleOpenModal as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "openSparringModal",
        handleOpenModal as EventListener
      );
    };
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isModalOpen || !gamefowlId) {
    return null;
  }

  return (
    <GamefowlSparringModal
      gamefowlId={gamefowlId}
      gamefowlName={gamefowlName}
      sparringMatches={sparringMatches}
      onClose={handleCloseModal}
    />
  );
}
