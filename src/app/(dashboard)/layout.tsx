import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* LEFT - Only visible on desktop */}
      <div className="hidden lg:block w-[20%] xl:w-[18%] p-4 dark:bg-gray-900">
        <Link href="/" className="flex items-center justify-start gap-2">
          <Image src="/logo.ico" alt="logo" width={32} height={32} />
          <span className="font-bold dark:text-white">GamefowlGuardian</span>
        </Link>
        <Menu />
      </div>
      {/* RIGHT - Full width on mobile */}
      <div className="w-full lg:w-[80%] xl:w-[82%] bg-[#F7F8FA] dark:bg-gray-950 overflow-scroll flex flex-col relative">
        {/* Mobile Menu - Positioned absolutely */}
        <div className="lg:hidden absolute top-4 left-4 z-50">
          <Menu />
        </div>
        <Navbar />
        {children}
      </div>
    </div>
  );
}
