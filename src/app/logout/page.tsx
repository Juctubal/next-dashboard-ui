"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut();
      router.push("/sign-in");
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ggSkyLight to-indigo-100">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-700">Signing out...</span>
        </div>
      </div>
    </div>
  );
}
