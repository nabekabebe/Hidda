import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

export function getDatabaseUrl(): string | undefined {
  const url =
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim();
  return url || undefined;
}

let cached: Sql | null | undefined;

export function getSql(): Sql | null {
  if (cached !== undefined) return cached;
  const url = getDatabaseUrl();
  cached = url ? neon(url) : null;
  return cached;
}
