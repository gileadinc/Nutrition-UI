import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { ToastViewport } from "@/components/Toast/ToastViewport";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "ForkThis",
  description: "ForkThis — what to order and what to cook, shaped around your goal and your day.",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

export const viewport: Viewport = { themeColor: "#FBFBFB" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* useSearchParams() in client screens needs a Suspense boundary above it. */}
        <Suspense fallback={null}>{children}</Suspense>
        <ToastViewport />
      </body>
    </html>
  );
}
