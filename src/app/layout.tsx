import type { Metadata, Viewport } from "next";
import {
  Inter,
  Courier_Prime,
  Space_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  DM_Mono,
  Outfit,
  Manrope
} from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
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
        <html lang="en" className={`
          ${inter.variable} 
          ${courierPrime.variable} 
          ${spaceMono.variable} 
          ${ibmPlexMono.variable} 
          ${jetBrainsMono.variable} 
          ${dmMono.variable} 
          ${outfit.variable} 
          ${manrope.variable}
        `}>
          <body suppressHydrationWarning>
            {children}
          </body>
        </html>
      </PreferenceProvider>
    </ClerkProvider>
  );
}
