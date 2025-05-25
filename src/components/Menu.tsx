import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MenuItems from "./MenuItems";

const Menu = async () => {
  const user = await currentUser();
  const role = (user?.publicMetadata.role as string)?.toLowerCase();
  const userId = user?.id;

  const menuItems = [
    {
      title: "MENU",
      items: [
        {
          icon: "/home.png",
          label: "Home",
          href: "/",
          visible: ["admin", "handler", "breeder"],
        },
        {
          icon: "/staff.png",
          label: "Staff",
          href: "/list/staff",
          visible: ["admin"],
        },
        {
          icon: "/gfowl.png",
          label: "Gamefowl Records",
          href: "/list/gamefowls",
          visible: ["admin", "handler", "breeder"],
        },
        {
          icon: "/class.png",
          label: "Medical Records",
          href: "/list/medical",
          visible: ["admin", "handler"],
        },
        {
          icon: "/lesson.png",
          label: "Breeding",
          href: "/list/breeding",
          visible: ["admin", "breeder"],
        },
        {
          icon: "/egg.png",
          label: "Incubation",
          href: "/list/incubation",
          visible: ["admin", "breeder"],
        },
        {
          icon: "/schedule.png",
          label: "Schedules",
          href: "/list/schedules",
          visible: ["admin", "handler", "breeder"],
        },
        {
          icon: "/spar.png",
          label: "Sparring",
          href: "/list/sparring",
          visible: ["admin", "handler"],
        },
        {
          icon: "/calendar.png",
          label: "Conditioning & Events",
          href: "/list/events",
          visible: ["admin", "handler"],
        },
        {
          icon: "/assignment.png",
          label: "Recommendation Module",
          href: "/recommendations",
          visible: ["admin", "handler", "breeder"],
        },
      ],
    },
    {
      title: "OTHER",
      items: [
        {
          icon: "/profile.png",
          label: "Profile",
          href: `/list/staff/${userId}`,
          visible: ["admin", "handler", "breeder"],
        },
        {
          icon: "/setting.png",
          label: "Settings",
          href: "/settings",
          visible: ["admin", "handler", "breeder"],
        },
        {
          icon: "/logout.png",
          label: "Logout",
          href: "/logout",
          visible: ["admin", "handler", "breeder"],
        },
      ],
    },
  ];

  return <MenuItems menuItems={menuItems} role={role} />;
};

export default Menu;
