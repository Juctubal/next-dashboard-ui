"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { Breeding, Gamefowl } from "@prisma/client";
import FormModal from "@/components/FormModal";

type BreedingWithRelations = Breeding & {
  sire: Gamefowl;
  dam: Gamefowl;
  startDate: Date;
  endDate: Date | null;
};

interface BreedingTableRowProps {
  item: BreedingWithRelations;
}

const BreedingTableRow = ({ item }: BreedingTableRowProps) => {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(`/api/breeding/${item.id}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isArchived: !item.isArchived }),
      });

      if (!response.ok) {
        throw new Error("Failed to update archive status");
      }

      toast.success(
        `Breeding record ${
          item.isArchived ? "unarchived" : "archived"
        } successfully`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating archive status:", error);
      toast.error("Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">{item.id}</td>
      <td className="p-4 dark:text-gray-200">
        <div className="flex flex-col">
          <span className="font-medium">{item.sire.name}</span>
          <span className="text-xs text-gray-500">ID: {item.sireId}</span>
        </div>
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        <div className="flex flex-col">
          <span className="font-medium">{item.dam.name}</span>
          <span className="text-xs text-gray-500">ID: {item.damId}</span>
        </div>
      </td>
      <td className="hidden lg:table-cell p-4 dark:text-gray-200">
        {new Date(item.startDate).toLocaleDateString()}
      </td>
      <td className="hidden lg:table-cell p-4 dark:text-gray-200">
        {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.notes}
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.status}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <FormModal table="breeding" type="update" data={item} />
          <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-ggYellow"
          >
            <Image
              src={item.isArchived ? "/unarchive.svg" : "/archive.svg"}
              alt={item.isArchived ? "Unarchive" : "Archive"}
              width={16}
              height={16}
            />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BreedingTableRow;
