import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// Need to use dynamic import for client component in server component
import dynamic from "next/dynamic";

// Dynamically import with no SSR to avoid hydration issues
const ServiceWorkerRegistration = dynamic(
  () => import("@/components/ServiceWorkerRegistration"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gamefowl Guardian MIS",
  description: "Next.js Gamefowl Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      {/* Added suppressHydrationWarning to prevent hydration errors with Clerk */}
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster richColors position="top-center" />
            <ServiceWorkerRegistration />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
