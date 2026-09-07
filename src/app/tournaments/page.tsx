import type { Metadata } from "next";
import TournamentsExplorer from "./tournaments-explorer";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Find your next skill-based competition on WinOX.",
};

export default function TournamentsPage() {
  return <TournamentsExplorer />;
}
