import type { Metadata } from "next";
import { QuizFlow } from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Start your quiz — ForkThis!",
};

export default function OnboardingPage() {
  return <QuizFlow />;
}
