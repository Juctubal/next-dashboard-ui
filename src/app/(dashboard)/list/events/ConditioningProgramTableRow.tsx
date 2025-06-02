"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormModal from "@/components/FormModal";

interface ConditioningProgram {
  id: string;
  programName: string;
  description: string;
  isArchived: boolean;
}

interface ConditioningProgramTableRowProps {
  item: ConditioningProgram;
  role: string;
}

const ConditioningProgramTableRow = ({ item, role }: ConditioningProgramTableRowProps) => {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveToggle = async (archive: boolean) => {
    if (archive) {
      const confirmed = window.confirm("Are you sure you want to archive this conditioning program?");
      if (!confirmed) return;
    }
    setIsArchiving(true);
    try {
      // Log the request for debugging
      console.log(`Archiving conditioning program ${item.id}:`, { archive });
      
      // Use the working archive-test API endpoint instead of the direct conditioning-program archive endpoint
      const response = await fetch(`/api/archive-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "program",
          id: parseInt(item.id),
          isArchived: archive
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Archive API error:', errorData);
        throw new Error(errorData.error || "Failed to update archive status");
      }
      
      // Log successful response status
      console.log('Archive API success:', response.status);
      
      // Update succeeded in the database
      if (archive) {
        toast.success("Conditioning program successfully archived");
        
        // If we've archived an item and aren't showing archived items,
        // hide this row immediately by adding a CSS class
        const showArchived = new URLSearchParams(window.location.search).get("showArchived") === "true";
        if (!showArchived) {
          // Get the parent row and add a class to hide it
          const row = document.getElementById(`conditioning-program-row-${item.id}`);
          if (row) {
            row.style.display = "none";
          }
          
          // Hard navigate to refresh the page completely after a short delay with cache busting
          console.log('[CLIENT] Preparing for page refresh after archive');
          setTimeout(() => {
            console.log('[CLIENT] Performing hard reload with cache busting');
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('_cb', Date.now().toString());
            window.location.href = currentUrl.toString();
          }, 1000);
        } else {
          // For archive page, refresh to show updated UI
          router.refresh();
        }
      } else {
        toast.success("Conditioning program unarchived");
        
        // For unarchiving, always do a full page refresh with cache busting
        console.log('[CLIENT] Preparing for page refresh after unarchive');
        setTimeout(() => {
          console.log('[CLIENT] Performing hard reload with cache busting');
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('_cb', Date.now().toString());
          window.location.href = currentUrl.toString();
        }, 1000);
      }
    } catch (error) {
      console.error("Archive toggle error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update archive status");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <tr
      id={`conditioning-program-row-${item.id}`}
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/50 text-sm hover:bg-ggPurpleLight dark:hover:bg-gray-700"
    >
      <td className="p-4 dark:text-gray-200">
        <div className="flex flex-col">
          <span>{item.programName}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ID: {item.id}
          </span>
        </div>
      </td>
      <td className="hidden md:table-cell p-4 dark:text-gray-200">
        {item.description}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="conditioningProgram" type="update" data={item} />
              <FormModal table="conditioningProgram" type="delete" id={item.id} />
            </>
          )}
          <button
            onClick={() => handleArchiveToggle(!item.isArchived)}
            disabled={isArchiving}
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
              item.isArchived
                ? "bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
            }`}
            title={item.isArchived ? "Unarchive Program" : "Archive Program"}
          >
            {item.isArchived ? "Unarchive" : "Archive"}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ConditioningProgramTableRow;
