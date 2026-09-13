import { currentUserId } from "@project/auth";
import { listActiveIncidents } from "@project/domain";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  const incidents = await listActiveIncidents();

  return (
    <main className="space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Active incidents</h1>
        <p className="text-sm text-neutral-500">
          Signed in as <code className="rounded bg-neutral-100 px-1">{userId}</code>
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest safety feed</h2>
          <a href="/api/health" className="text-sm text-blue-600 underline">
            Health check
          </a>
        </div>

        <div className="space-y-3">
          {incidents.length === 0 ? (
            <p className="text-neutral-600">No active incidents right now.</p>
          ) : (
            incidents.map((incident) => (
              <article
                key={incident.id}
                className="rounded border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <h3 className="font-semibold">{incident.title}</h3>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    {incident.severity}
                  </span>
                </div>
                <div className="text-sm text-neutral-600">
                  <p>{incident.category}</p>
                  <p>{incident.address ?? "Location unavailable"}</p>
                  <p>{new Date(incident.createdAt).toLocaleString()}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}