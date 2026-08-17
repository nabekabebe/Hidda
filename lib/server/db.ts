import postgres from "postgres";

export type Sql = postgres.Sql;

export function getDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
  ];
  for (const value of candidates) {
    const url = value?.trim();
    if (url && !url.startsWith("prisma+")) return url;
  }
  return undefined;
}

let cached: Sql | null | undefined;

export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = getDatabaseUrl();
  cached = url
    ? postgres(url, {
        ssl: "require",
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
      })
    : null;
  return cached;
}
