"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 300;

const TableSearch = ({
  className = "",
  disabled = false,
}: {
  className?: string;
  disabled?: boolean;
}) => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial value from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get("search") || "");
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (disabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`${window.location.pathname}?${params}`);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, disabled, router]);

  // Optional: keep Enter for accessibility, but just prevent default
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full md:w-auto flex md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 dark:ring-gray-600 px-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        className="w-[200px] p-2 bg-transparent outline-none dark:text-gray-200 dark:placeholder-gray-400"
        disabled={disabled}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </form>
  );
};

export default TableSearch;
