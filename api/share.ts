import type { ApiRequest, ApiResponse } from "../lib/server/http.js";
import { getSql } from "../lib/server/db.js";
import { insertShare, parseShareBody } from "../lib/server/share-repo.js";
import { ensureSchema } from "../lib/server/schema.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sql = getSql();
  if (!sql) {
    res.status(503).json({
      configured: false,
      error: "Postgres is not linked. The link was saved on this device only.",
    });
    return;
  }

  try {
    await ensureSchema(sql);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const record = parseShareBody(body);
    const saved = await insertShare(sql, record);
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not create share" });
  }
}
