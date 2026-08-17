import { isShareRecord, normalizeSnapshot } from "./src/domain/share";
import type { ShareRecord } from "./src/domain/types";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { Connect, Plugin } from "vite";

const STORE = path.resolve(__dirname, "node_modules/.tmp/night-atlas-shares.json");

function readStore(): Record<string, ShareRecord> {
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE, "utf8")) as Record<string, ShareRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(records: Record<string, ShareRecord>) {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(records));
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function shareApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (url !== "/api/share" && !url.startsWith("/api/share/")) {
      next();
      return;
    }

    void (async () => {
      try {
        const tokenMatch = url.match(/^\/api\/share\/([^/]+)$/);

        if (req.method === "POST" && url === "/api/share") {
          const body = await readBody(req);
          if (!isShareRecord(body)) {
            send(res, 400, { error: "Expected a share record" });
            return;
          }
          const record: ShareRecord = { ...body, snapshot: normalizeSnapshot(body.snapshot) };
          const records = readStore();
          records[record.token] = record;
          writeStore(records);
          send(res, 201, record);
          return;
        }

        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          const records = readStore();
          const current = records[token];

          if (req.method === "GET") {
            if (!current) {
              send(res, 404, { error: "This share link was not found" });
              return;
            }
            send(res, 200, current);
            return;
          }

          if (req.method === "PUT") {
            if (!current) {
              send(res, 404, { error: "Share not found" });
              return;
            }
            if (current.permission !== "edit") {
              send(res, 403, { error: "This link is view only" });
              return;
            }
            const body = (await readBody(req)) as { snapshot?: unknown };
            const snapshot = normalizeSnapshot(body.snapshot as ShareRecord["snapshot"]);
            const updated = { ...current, snapshot };
            records[token] = updated;
            writeStore(records);
            send(res, 200, updated);
            return;
          }

          res.setHeader("Allow", "GET, PUT");
          send(res, 405, { error: "Method not allowed" });
          return;
        }

        send(res, 404, { error: "Not found" });
      } catch {
        send(res, 500, { error: "Share failed" });
      }
    })();
  };
}

export function nightAtlasSharePlugin(): Plugin {
  return {
    name: "night-atlas-share-api",
    configureServer(server) {
      server.middlewares.use(shareApiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(shareApiMiddleware());
    },
  };
}
