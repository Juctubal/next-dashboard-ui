import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

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
        icon: "/schedule.png",
        label: "Schedules",
        href: "/list/schedules",
        visible: ["admin", "handler", "breeder"],
      },
      // {
      //   icon: "/exam.png",
      //   label: "Conditioning & Events",
      //   href: "/list/exams",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
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
        label: "Statistics and Reports",
        href: "/list/assignments",
        visible: ["admin", "handler", "breeder"],
      },
      // {
      //   icon: "/result.png",
      //   label: "Results",
      //   href: "/list/results",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      // {
      //   icon: "/attendance.png",
      //   label: "Attendance",
      //   href: "/list/attendance",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      // {
      //   icon: "/message.png",
      //   label: "Messages",
      //   href: "/list/messages",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      // {
      //   icon: "/announcement.png",
      //   label: "Announcements",
      //   href: "/list/announcements",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
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

const Menu = async () => {
  const user = await currentUser();
  const role = (user?.publicMetadata.role as string)?.toLowerCase();

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 dark:text-gray-500 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.map((r) => r.toLowerCase()).includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 dark:text-gray-400 py-2 md:px-2 rounded-md hover:bg-ggSkyLight dark:hover:bg-gray-800"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
