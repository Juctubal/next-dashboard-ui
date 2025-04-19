"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser, useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LoginPage = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role as string;

    if (role) {
      router.push(`/${role.toLowerCase()}`);
    }
  }, [user, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn?.create({
        identifier: (
          document.querySelector('input[name="identifier"]') as HTMLInputElement
        )?.value,
        password: (
          document.querySelector('input[name="password"]') as HTMLInputElement
        )?.value,
      });

      if (result?.status === "complete") {
        // Sign in successful
        setIsLoading(false);
      } else {
        // Sign in failed
        setIsLoading(false);
        setError("Invalid username or password");
      }
    } catch (err) {
      setIsLoading(false);
      setError("An error occurred during sign in");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ggSkyLight to-indigo-100 p-4">
      <SignIn.Root>
        <SignIn.Step
          name="start"
          className="bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl flex flex-col gap-4 w-full max-w-md transform transition-all duration-300 hover:shadow-2xl"
        >
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.ico"
                alt=""
                width={32}
                height={32}
                className="animate-pulse"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Gamefowl Guardian
              </h1>
            </div>
            <h2 className="text-gray-500 text-sm">
              Welcome back! Please sign in to your account
            </h2>
          </div>

          <Clerk.GlobalError className="text-sm text-red-500 bg-red-50 p-3 rounded-lg" />
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Clerk.Field name="identifier" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm font-medium text-gray-700">
              Username
            </Clerk.Label>
            <Clerk.Input
              type="text"
              required
              className="p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none"
              placeholder="Enter your username"
            />
            <Clerk.FieldError className="text-xs text-red-500" />
          </Clerk.Field>

          <Clerk.Field name="password" className="flex flex-col gap-2">
            <Clerk.Label className="text-sm font-medium text-gray-700">
              Password
            </Clerk.Label>
            <Clerk.Input
              type="password"
              required
              className="p-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 outline-none"
              placeholder="Enter your password"
            />
            <Clerk.FieldError className="text-xs text-red-500" />
          </Clerk.Field>

          <SignIn.Action
            submit
            onClick={handleSignIn}
            className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-sm font-medium p-3 hover:from-indigo-700 hover:to-indigo-800 transform transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
            </div>
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
};

export default LoginPage;
