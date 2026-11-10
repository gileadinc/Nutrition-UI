import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/** The app opens on the welcome screen (create account / sign in / guest). */
export default function HomePage() {
  redirect(ROUTES.welcome);
}
