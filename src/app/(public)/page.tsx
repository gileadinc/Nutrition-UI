import type { Metadata } from "next";
import { LandingPage } from "@/screens/landing/Landing";

export const metadata: Metadata = {
  title: "ForkThis! — healthy made easier",
  description:
    "Practical swaps, everyday recipes, low-pressure tracking, and free browsing — built by a doctor and someone who has lived it.",
};

export default function Page() {
  return <LandingPage />;
}
