import type { AtlasInscription, PersonDraft, RelationshipKind } from "../src/domain/types.js";
import { getSql } from "./db.js";
import {
  clearAll,
  createPerson,
  createRelationship,
  deletePerson,
  deleteRelationship,
  loadSnapshot,
  resetToSeed,
  updateAtlas,
  updatePerson,
} from "./family-repo.js";
import type { ApiRequest, ApiResponse } from "./http.js";
import { ensureSchema } from "./schema.js";

type FamilyOp =
  | { op: "createPerson"; draft: PersonDraft }
  | { op: "updatePerson"; id: string; patch: Partial<PersonDraft> }
  | { op: "deletePerson"; id: string }
  | { op: "createRelationship"; sourcePersonId: string; targetPersonId: string; type: RelationshipKind; metadata?: Record<string, string> }
  | { op: "deleteRelationship"; id: string }
  | { op: "resetToSeed" }
  | { op: "clearAll" }
  | { op: "updateAtlas"; patch: { name?: string; inscriptions?: AtlasInscription[] } };

function unconfigured(res: ApiResponse) {
  res.status(503).json({
    configured: false,
    error: "Postgres is not linked. Set POSTGRES_URL or DATABASE_URL.",
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const sql = getSql();
  if (!sql) {
    unconfigured(res);
    return;
  }

  try {
    await ensureSchema(sql);

    if (req.method === "GET") {
      const snapshot = await loadSnapshot(sql);
      res.status(200).json({ configured: true, ...snapshot });
      return;
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as FamilyOp;
    if (!body || typeof body !== "object" || !("op" in body)) {
      res.status(400).json({ error: "Expected a JSON body with an op field" });
      return;
    }

    switch (body.op) {
      case "createPerson":
        res.status(201).json(await createPerson(sql, body.draft));
        return;
      case "updatePerson":
        res.status(200).json(await updatePerson(sql, body.id, body.patch));
        return;
      case "deletePerson":
        res.status(200).json(await deletePerson(sql, body.id));
        return;
      case "createRelationship":
        res.status(201).json(
          await createRelationship(sql, body.sourcePersonId, body.targetPersonId, body.type, body.metadata),
        );
        return;
      case "deleteRelationship":
        await deleteRelationship(sql, body.id);
        res.status(204).end();
        return;
      case "resetToSeed":
        res.status(200).json(await resetToSeed(sql));
        return;
      case "clearAll":
        res.status(200).json(await clearAll(sql));
        return;
      case "updateAtlas":
        res.status(200).json(await updateAtlas(sql, body.patch));
        return;
      default:
        res.status(400).json({ error: "Unknown op" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Family API failed";
    const status = message === "Person not found" ? 404 : 500;
    res.status(status).json({ error: message });
  }
}
