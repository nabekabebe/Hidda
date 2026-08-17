import { isShareRecord, normalizeSnapshot, snapshotForShare } from "@/domain/share";
import type { FamilySnapshot, SharePermission, ShareRecord, ShareScope } from "@/domain/types";

const SHARE_KEY = "night-atlas.shares.v1";

function readLocal(): Record<string, ShareRecord> {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ShareRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(records: Record<string, ShareRecord>) {
  localStorage.setItem(SHARE_KEY, JSON.stringify(records));
}

function cacheLocal(record: ShareRecord) {
  const local = readLocal();
  local[record.token] = record;
  writeLocal(local);
}

async function readShareResponse(response: Response): Promise<ShareRecord | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("json")) return null;
  const body = (await response.json()) as unknown;
  if (!isShareRecord(body)) return null;
  return { ...body, snapshot: snapshotForShare(body.snapshot, body.permission, body.showLiving) };
}

export async function createShareRecord(input: {
  permission: SharePermission;
  scope: ShareScope;
  rootPersonId?: string;
  snapshot: FamilySnapshot;
  showLiving?: boolean;
}): Promise<{ record: ShareRecord; remote: boolean }> {
  const record: ShareRecord = {
    token: crypto.randomUUID(),
    permission: input.permission,
    scope: input.scope,
    rootPersonId: input.rootPersonId,
    snapshot: snapshotForShare(input.snapshot, input.permission, input.showLiving),
    createdAt: new Date().toISOString(),
    showLiving: Boolean(input.showLiving),
  };
  cacheLocal(record);

  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const saved = await readShareResponse(response);
    if (saved) {
      cacheLocal(saved);
      return { record: saved, remote: true };
    }
  } catch {
    /* stay local */
  }
  return { record, remote: false };
}

export async function loadShareRecord(token: string): Promise<ShareRecord | null> {
  const id = decodeURIComponent(token).trim();
  const local = readLocal()[id];
  if (local && isShareRecord(local)) {
    return { ...local, snapshot: snapshotForShare(local.snapshot, local.permission, local.showLiving) };
  }

  try {
    const response = await fetch(`/api/share/${encodeURIComponent(id)}`);
    const saved = await readShareResponse(response);
    if (saved) {
      cacheLocal(saved);
      return saved;
    }
  } catch {
    /* fall through */
  }
  return null;
}

export async function saveShareSnapshot(token: string, snapshot: FamilySnapshot): Promise<void> {
  const normalized = normalizeSnapshot(snapshot);
  const local = readLocal();
  const current = local[token];
  if (current) {
    local[token] = { ...current, snapshot: normalized };
    writeLocal(local);
  }
  try {
    await fetch(`/api/share/${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot: normalized }),
    });
  } catch {
    /* local copy is enough when the API is offline */
  }
}
