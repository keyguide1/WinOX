import type { Metadata } from "next";
import TournamentDetail from "./tournament-detail";

export const metadata: Metadata = {
  title: "Tournament details",
  description: "View tournament rules, schedule, and availability on WinOX.",
};

export default function TournamentDetailPage() {
  return <TournamentDetail />;
}
