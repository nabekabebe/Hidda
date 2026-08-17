import { isShareRecord, normalizeSnapshot } from "../../src/domain/share.js";
import type { FamilySnapshot, ShareRecord } from "../../src/domain/types.js";
import type { Sql } from "./db.js";

interface ShareRow {
  token: string;
  permission: ShareRecord["permission"];
  scope: ShareRecord["scope"];
  root_person_id: string | null;
  snapshot: FamilySnapshot | string;
  created_at: string | Date;
}

function fromRow(row: ShareRow): ShareRecord {
  const snapshot = typeof row.snapshot === "string" ? (JSON.parse(row.snapshot) as FamilySnapshot) : row.snapshot;
  return {
    token: row.token,
    permission: row.permission,
    scope: row.scope,
    rootPersonId: row.root_person_id ?? undefined,
    snapshot: normalizeSnapshot(snapshot),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function insertShare(sql: Sql, record: ShareRecord): Promise<ShareRecord> {
  const snapshot = normalizeSnapshot(record.snapshot);
  await sql`
    INSERT INTO shares (token, permission, scope, root_person_id, snapshot, created_at)
    VALUES (
      ${record.token},
      ${record.permission},
      ${record.scope},
      ${record.rootPersonId ?? null},
      ${JSON.stringify(snapshot)}::jsonb,
      ${record.createdAt}::timestamptz
    )
    ON CONFLICT (token) DO UPDATE SET
      permission = EXCLUDED.permission,
      scope = EXCLUDED.scope,
      root_person_id = EXCLUDED.root_person_id,
      snapshot = EXCLUDED.snapshot
  `;
  return { ...record, snapshot };
}

export async function getShare(sql: Sql, token: string): Promise<ShareRecord | null> {
  const rows = (await sql`SELECT * FROM shares WHERE token = ${token} LIMIT 1`) as ShareRow[];
  const row = rows[0];
  return row ? fromRow(row) : null;
}

export async function updateShareSnapshot(sql: Sql, token: string, snapshot: FamilySnapshot): Promise<ShareRecord> {
  const current = await getShare(sql, token);
  if (!current) throw new Error("Share not found");
  if (current.permission !== "edit") throw new Error("This link is view only");
  const next = normalizeSnapshot(snapshot);
  await sql`
    UPDATE shares SET snapshot = ${JSON.stringify(next)}::jsonb WHERE token = ${token}
  `;
  return { ...current, snapshot: next };
}

export function tokenFromApiRequest(req: { query?: Record<string, string | string[] | undefined>; url?: string }): string {
  const query = req.query?.token;
  if (typeof query === "string" && query) return decodeURIComponent(query);
  if (Array.isArray(query) && query[0]) return decodeURIComponent(query[0]);
  const url = req.url ?? "";
  const match = url.match(/\/api\/share\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export function parseShareBody(body: unknown): ShareRecord {
  if (!isShareRecord(body)) throw new Error("Expected a share record");
  return {
    ...body,
    snapshot: normalizeSnapshot(body.snapshot),
  };
}
