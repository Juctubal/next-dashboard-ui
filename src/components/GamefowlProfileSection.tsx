"use client";

import { useState } from "react";
import Image from "next/image";
import { GamefowlPictureModal } from "./modals/GamefowlPictureModal";

interface GamefowlProfileSectionProps {
  gamefowl: {
    id: number;
    img: string | null;
    name: string;
  };
}

export default function GamefowlProfileSection({
  gamefowl,
}: GamefowlProfileSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-1/3">
      <div
        className="relative group cursor-pointer w-36 h-36"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-md group-hover:shadow-lg transition-shadow duration-300">
          <Image
            src={gamefowl.img || "/noAvatar.png"}
            alt={gamefowl.name}
            width={144}
            height={144}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 w-full h-full bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-sm font-medium">Change Photo</span>
        </div>
      </div>
      {isModalOpen && (
        <GamefowlPictureModal
          gamefowlId={gamefowl.id.toString()}
          currentImage={gamefowl.img || ""}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
