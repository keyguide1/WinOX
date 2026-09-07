"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string;
  rules: unknown;
  capacity: number;
  startsAt: string;
  game: { name: string; description: string };
  organizer: { displayName: string } | null;
  _count: { entries: number; matches: number };
};

export default function TournamentDetail() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}`)
      .then(async (response) => {
        const payload = await response.json() as { success: boolean; data?: { tournament: Tournament } };
        if (!response.ok || !payload.success || !payload.data) throw new Error("Tournament not found.");
        setTournament(payload.data.tournament);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [params.id]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-20 items-center justify-between border-b border-[var(--line)]">
          <Link href="/tournaments" className="text-sm font-semibold text-[var(--muted)] hover:text-white">← All tournaments</Link>
          <span className="rounded bg-[var(--panel)] px-2 py-1 text-xs font-bold text-[var(--lime)]">DEMO</span>
        </header>
        {state === "loading" && <p className="py-20 text-[var(--muted)]">Loading tournament...</p>}
        {state === "error" && <div className="py-20"><h1 className="text-3xl font-bold">Tournament unavailable</h1><p className="mt-3 text-[var(--muted)]">This tournament may have closed or no longer exists.</p></div>}
        {state === "ready" && tournament && (
          <article className="py-14 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--cyan)]">{tournament.game.name}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{tournament.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{tournament.game.description}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Info label="Starts" value={new Date(tournament.startsAt).toLocaleString()} />
              <Info label="Players" value={`${tournament._count.entries} / ${tournament.capacity}`} />
              <Info label="Organizer" value={tournament.organizer?.displayName ?? "WinOX"} />
            </div>
            <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
              <h2 className="text-xl font-bold">Competition rules</h2>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{JSON.stringify(tournament.rules, null, 2)}</pre>
              <p className="mt-6 rounded-lg bg-[var(--panel-raised)] p-4 text-sm text-[var(--muted)]">Free demo competition. Real-money entry and prizes are disabled.</p>
            </section>
          </article>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4"><p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>;
}
