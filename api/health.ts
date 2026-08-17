import type { ApiRequest, ApiResponse } from "../lib/server/http.js";
import { getDatabaseUrl, getSql } from "../lib/server/db.js";
import { ensureSchema } from "../lib/server/schema.js";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const url = getDatabaseUrl();
  if (!url) {
    res.status(200).json({
      ok: true,
      database: "unconfigured",
      hint: "Set POSTGRES_URL or DATABASE_URL on Vercel, then set VITE_FAMILY_API=http.",
    });
    return;
  }

  try {
    const sql = getSql();
    if (!sql) {
      res.status(500).json({ ok: false, database: "unconfigured" });
      return;
    }
    await ensureSchema(sql);
    const rows = (await sql`SELECT 1 AS ok`) as { ok: number }[];
    res.status(200).json({
      ok: rows[0]?.ok === 1,
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: "error",
      error: error instanceof Error ? error.message : "Database ping failed",
    });
  }
}
