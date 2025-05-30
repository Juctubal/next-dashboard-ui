import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import NavbarNotificationButton from "./NavbarNotificationButton";

const Navbar = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      {/* <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 dark:ring-gray-700 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none dark:text-white"
        />
      </div> */}
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {role === "admin" && (
          <Link
            href="/admin/update-age"
            className="bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative group"
            title="Update Gamefowl Ages"
          >
            <Image src="/date.png" alt="Update Ages" height={20} width={20} />
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              Update Ages
            </span>
          </Link>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" height={20} width={20} />
        </div>
        <NavbarNotificationButton />
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium dark:text-white">
            {user?.username || "User"}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 text-right">
            {role}
          </span>
        </div>
        {/* <Image
          src="/avatar.png"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        /> */}
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
