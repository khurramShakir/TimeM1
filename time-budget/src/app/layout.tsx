import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
import { Courier_Prime } from "next/font/google";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} ${courierPrime.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
