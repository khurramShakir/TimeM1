import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
import { Courier_Prime } from "next/font/google";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "block",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Time Budget",
  description: "Track your time budget",
  manifest: "/manifest.json",
};

import { ClerkProvider } from "@clerk/nextjs";
import { PreferenceProvider } from "@/context/PreferenceContext";
import { getUserSettings } from "@/lib/actions";
import { auth } from "@clerk/nextjs/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  let initialSettings = null;

  if (userId) {
    try {
      initialSettings = await getUserSettings();
    } catch (e) {
      console.error("Failed to fetch settings for layout", e);
    }
  }

  return (
    <ClerkProvider>
      <PreferenceProvider initialSettings={initialSettings as any}>
        <html lang="en" className={`${inter.variable} ${courierPrime.variable}`}>
          <body>
            {children}
          </body>
        </html>
      </PreferenceProvider>
    </ClerkProvider>
  );
}
