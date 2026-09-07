import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  try {
    await requireAdmin("VIEW_DASHBOARD");
  } catch {
    redirect("/");
  }

  const [players, activePlayers, activeTournaments, openRiskCases, pendingResults, activeMatches, recentAudit] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "ACTIVE", lastLoginAt: { not: null } } }),
    db.tournament.count({ where: { status: "OPEN" } }),
    db.riskCase.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    db.matchResult.count({ where: { verifiedAt: null } }),
    db.match.count({ where: { status: "IN_PROGRESS" } }),
    db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { action: true, targetId: true, createdAt: true } }),
  ]);

  const cards = [
    ["Total players", players, "All registered accounts"],
    ["Active players", activePlayers, "Players with recent sign-in"],
    ["Open tournaments", activeTournaments, "Registration currently open"],
    ["Active matches", activeMatches, "Matches in progress"],
    ["Pending results", pendingResults, "Awaiting verification"],
    ["Open risk cases", openRiskCases, "Require authorized review"],
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-screen w-64 border-r border-[var(--line)] p-6 lg:block">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold">WIN<span className="text-[var(--lime)]">OX</span><span className="ml-auto rounded bg-[var(--lime)]/10 px-2 py-1 text-[10px] text-[var(--lime)]">ADMIN</span></Link>
          <nav className="mt-12 space-y-2 text-sm" aria-label="Admin navigation">
            <NavItem href="/admin/dashboard" label="Dashboard" active />
            <NavItem href="/admin/players" label="Players" />
            <NavItem href="/admin/tournaments" label="Tournaments" />
            <NavItem href="/admin/security" label="Security & risk" />
            <NavItem href="/admin/audit" label="Audit log" />
          </nav>
          <div className="mt-12 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-xs text-[var(--muted)]"><p className="font-semibold text-white">Financial controls</p><p className="mt-2">Unavailable while real-money operations are disabled.</p><span className="mt-3 inline-block rounded bg-[var(--panel-raised)] px-2 py-1 text-[var(--lime)]">DEMO MODE</span></div>
        </aside>
        <section className="min-w-0 flex-1 p-5 sm:p-8">
          <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--cyan)]">Operations console</p><h1 className="mt-2 text-3xl font-bold">Good evening, admin.</h1><p className="mt-1 text-sm text-[var(--muted)]">A real-time view of the platform that is authoritative, auditable, and safe.</p></div><Link href="/" className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:border-slate-500">View player site</Link></header>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, detail]) => <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p></div>)}</div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Recent administrative activity</h2><Link href="/admin/audit" className="text-xs font-semibold text-[var(--lime)]">View all</Link></div>{recentAudit.length ? <div className="mt-4 divide-y divide-[var(--line)]">{recentAudit.map((event) => <div key={`${event.action}-${event.createdAt.toISOString()}`} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{event.action.replaceAll("_", " ").toLowerCase()}</span><span className="shrink-0 text-xs text-[var(--muted)]">{event.createdAt.toLocaleDateString()}</span></div>)}</div> : <p className="mt-8 text-sm text-[var(--muted)]">No administrative activity recorded.</p>}</section><section className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5"><h2 className="font-bold">Operational boundaries</h2><ul className="mt-4 space-y-3 text-sm text-[var(--muted)]"><li className="flex gap-2"><span className="text-[var(--lime)]">●</span> Server-side authorization enabled</li><li className="flex gap-2"><span className="text-[var(--lime)]">●</span> Financial controls disabled in demo mode</li><li className="flex gap-2"><span className="text-[var(--lime)]">●</span> Risk signals require review</li><li className="flex gap-2"><span className="text-[var(--lime)]">●</span> Ledger history is not editable</li></ul></section></div>
        </section>
      </div>
    </main>
  );
}

function NavItem({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return <Link href={href} className={`block rounded-lg px-3 py-2.5 ${active ? "bg-[var(--panel-raised)] font-semibold text-white" : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"}`}>{label}</Link>;
}
