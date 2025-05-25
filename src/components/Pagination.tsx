"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };

  // If there are no items, don't show pagination
  if (count === 0) {
    return null;
  }

  return (
    <div className="p-4 flex items-center justify-between text-gray-500 dark:text-gray-400">
      <button
        disabled={!hasPrev}
        className="py-2 px-4 rounded-md bg-slate-200 dark:bg-gray-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-600"
        onClick={() => {
          changePage(page - 1);
        }}
      >
        Prev
      </button>
      <div className="flex items-center gap-2 text-sm">
        {(() => {
          const totalPages = Math.ceil(count / ITEM_PER_PAGE);
          const pages = [];
          const showPages = 5; // Number of pages to show around current page

          // Always show first page
          pages.push(1);

          // Calculate range around current page
          let start = Math.max(2, page - Math.floor(showPages / 2));
          let end = Math.min(totalPages - 1, start + showPages - 1);

          // Adjust start if we're near the end
          if (end === totalPages - 1) {
            start = Math.max(2, end - showPages + 1);
          }

          // Add ellipsis after first page if needed
          if (start > 2) {
            pages.push("...");
          }

          // Add pages around current page
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }

          // Add ellipsis before last page if needed
          if (end < totalPages - 1) {
            pages.push("...");
          }

          // Always show last page if there's more than one page
          if (totalPages > 1) {
            pages.push(totalPages);
          }

          return pages.map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                className={`px-2 rounded-sm ${
                  page === pageNum
                    ? "bg-ggSky dark:bg-ggSky/80 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => {
                  changePage(pageNum as number);
                }}
              >
                {pageNum}
              </button>
            )
          );
        })()}
      </div>

      <button
        className="py-2 px-4 rounded-md bg-slate-200 dark:bg-gray-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-600"
        disabled={!hasNext}
        onClick={() => {
          changePage(page + 1);
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
