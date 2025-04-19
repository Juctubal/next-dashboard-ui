"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface MenuItemsProps {
  menuItems: {
    title: string;
    items: {
      icon: string;
      label: string;
      href: string;
      visible: string[];
    }[];
  }[];
  role: string;
}

const MenuItems = ({ menuItems, role }: MenuItemsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme instead of theme to handle system theme
  const isDarkMode = mounted && resolvedTheme === "dark";

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      <div className="relative">
        {/* Burger Button - Only visible on mobile */}
        <button
          className="lg:hidden flex items-center justify-center p-2 text-gray-500 dark:text-white hover:bg-ggSkyLight/10 dark:hover:bg-gray-800/50 rounded-md transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Image
            src={isDarkMode ? "/burgerw.png" : "/burger.png"}
            alt="Menu"
            width={24}
            height={24}
            className={`transform transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Mobile Menu */}
        <div
          className={`${
            isExpanded
              ? "fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 z-50 p-4 shadow-lg overflow-y-auto"
              : "hidden"
          } lg:hidden`}
        >
          {menuItems.map((i) => (
            <div className="flex flex-col gap-2" key={i.title}>
              <span className="text-gray-400 dark:text-gray-500 font-light my-4">
                {i.title}
              </span>
              {i.items.map((item) => {
                if (item.visible.map((r) => r.toLowerCase()).includes(role)) {
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      className="flex items-center gap-4 text-gray-500 dark:text-gray-400 py-2 px-2 rounded-md hover:bg-ggSkyLight dark:hover:bg-gray-800"
                      onClick={() => setIsExpanded(false)}
                    >
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
              })}
            </div>
          ))}
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:block mt-4 text-sm">
          {menuItems.map((i) => (
            <div className="flex flex-col gap-2" key={i.title}>
              <span className="text-gray-400 dark:text-gray-500 font-light my-4">
                {i.title}
              </span>
              {i.items.map((item) => {
                if (item.visible.map((r) => r.toLowerCase()).includes(role)) {
                  return (
                    <Link
                      href={item.href}
                      key={item.label}
                      className="flex items-center justify-start gap-4 text-gray-500 dark:text-gray-400 py-2 px-2 rounded-md hover:bg-ggSkyLight dark:hover:bg-gray-800"
                    >
                      <Image src={item.icon} alt="" width={20} height={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MenuItems;
