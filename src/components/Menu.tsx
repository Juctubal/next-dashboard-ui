import { role } from "@/lib/data";
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
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/teacher.png",
        label: "Staff",
        href: "/list/handlers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Gamefowl Records",
        href: "/list/gamefowls",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/class.png",
        label: "Medical Records",
        href: "/list/vaccines",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        label: "Breeding",
        href: "/list/breeding",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Schedules",
        href: "/list/schedules",
        visible: ["admin"],
      },
      // {
      //   icon: "/exam.png",
      //   label: "Conditioning & Events",
      //   href: "/list/exams",
      //   visible: ["admin", "teacher", "student", "parent"],
      // },
      {
        icon: "/parent.png",
        label: "Leaderboard",
        href: "/list/leaderboard",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/calendar.png",
        label: "Conditioning & Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Statistics and Reports",
        href: "/list/assignments",
        visible: ["admin", "teacher", "student", "parent"],
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
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
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
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-ggSkyLight"
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
