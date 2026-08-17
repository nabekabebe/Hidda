import { AuthPanel } from "@/components/app/AuthPanel";
import { StarDisk } from "@/components/person/StarDisk";
import { RelLines } from "@/components/tree/RelLines";
import { NODE_W } from "@/domain/layout";
import { displayName } from "@/domain/types";
import { familyStats, useFamilyStore } from "@/store/useFamilyStore";
import { Button } from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const ready = useFamilyStore((s) => s.ready);
  const people = useFamilyStore((s) => s.people);
  const atlasName = useFamilyStore((s) => s.atlasName);
  const relationships = useFamilyStore((s) => s.relationships);
  const viewedIds = useFamilyStore((s) => s.viewedIds);
  const layout = useFamilyStore((s) => s.layout)();
  const startEmpty = useFamilyStore((s) => s.startEmpty);
  const navigate = useNavigate();
  const stats = familyStats(people, relationships);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const recent = [...people].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const viewed = viewedIds.map((id) => people.find((person) => person.id === id)).filter(Boolean);

  if (!ready) {
    return <div className="grid min-h-[100dvh] place-items-center text-[var(--muted)]">Charting the sky…</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--sky)] text-[var(--ink)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:px-8">
        <header className="flex items-center justify-between">
          <p className="catalog text-2xl text-[var(--bone)]">{atlasName}</p>
          <Link to="/tree" className="text-sm text-[var(--gold)]">
            Open the sky
          </Link>
        </header>
        <section className="grid gap-3">
          <h1 className="catalog text-5xl text-[var(--bone)] md:text-6xl">{hello}</h1>
          <p className="max-w-[40ch] text-[var(--muted)]">Your family as a living map. Continue where the last star left off.</p>
        </section>
        <section className="grid gap-3">
          <button
            type="button"
            onClick={() => navigate("/tree")}
            className="glass relative overflow-hidden rounded-[32px] p-4 text-left"
            aria-label="Continue exploring the family tree"
          >
            <div className="relative h-[320px] overflow-hidden md:h-[420px]">
              <div
                className="origin-top-left"
                style={{ transform: `scale(${Math.min(0.48, 640 / Math.max(layout.width, 1))})` }}
              >
                <RelLines edges={layout.edges} positions={layout.positions} />
                {people.map((person) => {
                  const pos = layout.positions.get(person.id);
                  if (!pos) return null;
                  return (
                    <div key={person.id} className="absolute" style={{ left: pos.x, top: pos.y, width: NODE_W }}>
                      <div className="flex flex-col items-center gap-1">
                        <StarDisk person={person} size={54} />
                        <span className="catalog text-lg uppercase tracking-[0.12em] text-[var(--bone)]">{person.firstName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="catalog mt-3 text-sm uppercase tracking-[0.16em] text-[var(--gold)]">
              {stats.members} stars · {stats.generations} generations
            </p>
          </button>
        </section>
        <section className="grid gap-4">
          <h2 className="catalog text-3xl text-[var(--bone)]">Recently added</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map((person) => (
              <Link key={person.id} to={`/tree?focus=${person.id}`} className="flex min-w-28 flex-col items-center gap-2">
                <StarDisk person={person} size={64} />
                <span className="catalog text-lg">{displayName(person)}</span>
              </Link>
            ))}
          </div>
        </section>
        {viewed.length ? (
          <section className="grid gap-4">
            <h2 className="catalog text-3xl text-[var(--bone)]">Recently viewed</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {viewed.map((person) =>
                person ? (
                  <Link key={person.id} to={`/tree?focus=${person.id}`} className="flex min-w-28 flex-col items-center gap-2">
                    <StarDisk person={person} size={52} />
                    <span className="text-sm">{person.firstName}</span>
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/tree")}>Continue exploring</Button>
          <Button tone="ghost" onClick={() => { void startEmpty(); navigate("/tree"); }}>
            Start a new atlas
          </Button>
        </div>
        <AuthPanel />
        <p className="text-xs text-[var(--muted)]">Demonstration people are synthetic.</p>
      </div>
    </div>
  );
}
