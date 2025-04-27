"use client";

import { useState } from "react";
import Image from "next/image";
import { ProfilePictureModal } from "./modals/ProfilePictureModal";

interface StaffProfileSectionProps {
  staff: {
    id: string;
    img: string | null;
    first_name: string;
    last_name: string;
  };
}

export default function StaffProfileSection({
  staff,
}: StaffProfileSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-1/3">
      <div
        className="relative group cursor-pointer w-36 h-36"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-md group-hover:shadow-lg transition-shadow duration-300">
          <Image
            src={staff.img || "/noAvatar.png"}
            alt={`${staff.first_name} ${staff.last_name}`}
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
        <ProfilePictureModal
          staffId={staff.id}
          currentImage={staff.img || ""}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
