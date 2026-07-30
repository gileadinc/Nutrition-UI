import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrition (placeholder)",
  description: "Placeholder shell — final branding and copy pending UX direction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
