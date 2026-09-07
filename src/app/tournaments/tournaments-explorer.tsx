"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Game = {
  id: string;
  slug: string;
  name: string;
  description: string;
  _count: { tournaments: number };
};

type Tournament = {
  id: string;
  name: string;
  capacity: number;
  startsAt: string;
  game: { id: string; slug: string; name: string };
  _count: { entries: number };
};

type ApiResponse<T> = { success: true; data: T } | { success: false; error: { message: string } };

export default function TournamentsExplorer() {
  const [games, setGames] = useState<Game[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/games").then((response) => response.json() as Promise<ApiResponse<{ games: Game[] }>>),
      fetch("/api/tournaments?pageSize=50").then((response) => response.json() as Promise<ApiResponse<{ tournaments: Tournament[] }>>),
    ]).then(([gamesResponse, tournamentsResponse]) => {
      if (!gamesResponse.success) throw new Error(gamesResponse.error.message);
      if (!tournamentsResponse.success) throw new Error(tournamentsResponse.error.message);
      setGames(gamesResponse.data.games);
      setTournaments(tournamentsResponse.data.tournaments);
    }).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tournaments.");
    }).finally(() => setLoading(false));
  }, []);

  const visibleTournaments = selectedGame
    ? tournaments.filter((tournament) => tournament.game.id === selectedGame)
    : tournaments;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-20 items-center justify-between border-b border-[var(--line)]">
          <Link href="/" className="flex items-center gap-3" aria-label="WinOX home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--lime)] text-sm font-black text-[#0b0d10]">W</span>
            <span className="text-lg font-bold tracking-tight">win<span className="text-[var(--lime)]">ox</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex" aria-label="Primary navigation">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <Link href="/tournaments" className="text-white">Tournaments</Link>
            <Link href="/#leaderboard" className="transition hover:text-white">Leaderboard</Link>
          </nav>
          <span className="rounded bg-[var(--panel)] px-2 py-1 text-xs font-bold text-[var(--lime)]">DEMO</span>
        </header>

        <section className="py-14 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--lime)]">Find your arena</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">Compete on your terms.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">
            Explore upcoming skill-based competitions. Demo tournaments are free to join while real-money features remain disabled.
          </p>
        </section>

        <section className="border-t border-[var(--line)] py-8" aria-labelledby="games-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="games-heading" className="text-xl font-bold">Browse by game</h2>
            <button type="button" onClick={() => setSelectedGame("")} className="text-sm font-semibold text-[var(--muted)] hover:text-white">
              All games
            </button>
          </div>
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {games.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => setSelectedGame(game.id)}
                className={`min-w-40 rounded-xl border p-4 text-left transition ${selectedGame === game.id ? "border-[var(--lime)] bg-[var(--lime)]/10" : "border-[var(--line)] bg-[var(--panel)] hover:border-slate-500"}`}
                aria-pressed={selectedGame === game.id}
              >
                <span className="block text-sm font-bold">{game.name}</span>
                <span className="mt-1 block text-xs text-[var(--muted)]">{game._count.tournaments} upcoming</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--line)] py-10" aria-labelledby="tournaments-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="tournaments-heading" className="text-2xl font-bold">Upcoming tournaments</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Open competitions ordered by start time.</p>
            </div>
            <span className="text-sm text-[var(--muted)]">{visibleTournaments.length} found</span>
          </div>

          {loading && <p className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)]">Loading competitions...</p>}
          {!loading && error && <p role="alert" className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-6 text-sm text-red-200">{error}</p>}
          {!loading && !error && visibleTournaments.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-[var(--line)] p-10 text-center">
              <p className="font-semibold">No tournaments found</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Try another game filter or check back soon.</p>
            </div>
          )}
          {!loading && !error && visibleTournaments.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visibleTournaments.map((tournament) => (
                <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-slate-500">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cyan)]">{tournament.game.name}</p>
                      <h3 className="mt-2 text-lg font-bold">{tournament.name}</h3>
                    </div>
                    <span className="rounded-full bg-[var(--lime)]/10 px-2.5 py-1 text-xs font-bold text-[var(--lime)]">Open</span>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm">
                    <span className="text-[var(--muted)]">{new Date(tournament.startsAt).toLocaleString()}</span>
                    <span className="font-semibold">{tournament._count.entries}/{tournament.capacity}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-[var(--line)] py-8 text-xs text-[var(--muted)]">
          <span className="mr-2 rounded bg-[var(--panel)] px-2 py-1 text-[var(--lime)]">DEMO</span>
          Real-money features are disabled in this environment.
        </footer>
      </div>
    </main>
  );
}
