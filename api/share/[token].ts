import { normalizeSnapshot } from "../../src/domain/share.js";
import { getSql } from "../../lib/server/db.js";
import type { ApiRequest, ApiResponse } from "../../lib/server/http.js";
import { ensureSchema } from "../../lib/server/schema.js";
import { getShare, tokenFromApiRequest, updateShareSnapshot } from "../../lib/server/share-repo.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const token = tokenFromApiRequest(req);
  if (!token) {
    res.status(400).json({ error: "Missing share token" });
    return;
  }

  const sql = getSql();
  if (!sql) {
    res.status(503).json({ configured: false, error: "Postgres is not linked" });
    return;
  }

  try {
    await ensureSchema(sql);
    if (req.method === "GET") {
      const record = await getShare(sql, token);
      if (!record) {
        res.status(404).json({ error: "This share link was not found" });
        return;
      }
      res.status(200).json(record);
      return;
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const snapshot = normalizeSnapshot(body?.snapshot);
      const record = await updateShareSnapshot(sql, token, snapshot);
      res.status(200).json(record);
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Share failed";
    const status = message === "Share not found" ? 404 : message === "This link is view only" ? 403 : 500;
    res.status(status).json({ error: message });
  }
}
