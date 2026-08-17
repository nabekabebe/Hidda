import { ExportStage } from "@/components/tree/ExportStage";
import type { FamilySnapshot } from "@/domain/types";
import { domToPng, waitUntilLoad } from "modern-screenshot";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

function skyColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--sky").trim() || "#141a2e";
}

export function fileSlug(name: string): string {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase() || "atlas";
}

export async function captureSnapshotPng(
  snapshot: FamilySnapshot,
  includeInscriptions: boolean,
): Promise<{ dataUrl: string; background: string }> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-16000px;top:0;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(<ExportStage snapshot={snapshot} includeInscriptions={includeInscriptions} />);
    });
    const node = host.querySelector<HTMLElement>("[data-atlas-export-stage]");
    if (!node) throw new Error("Export stage missing");
    await waitUntilLoad(node, { timeout: 8000 });
    const background = skyColor();
    const dataUrl = await domToPng(node, {
      width: Math.max(node.offsetWidth, 1),
      height: Math.max(node.offsetHeight, 1),
      scale: 2,
      backgroundColor: background,
    });
    return { dataUrl, background };
  } finally {
    root.unmount();
    host.remove();
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pngDataUrlToPdfBlob(pngDataUrl: string, background: string): Promise<Blob> {
  const img = new Image();
  img.src = pngDataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the sky");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const jpegUrl = canvas.toDataURL("image/jpeg", 0.92);
  const binary = atob(jpegUrl.split(",")[1] ?? "");
  const jpeg = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) jpeg[i] = binary.charCodeAt(i);
  return jpegToPdf(jpeg, canvas.width, canvas.height);
}

function jpegToPdf(jpeg: Uint8Array, width: number, height: number): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let cursor = 0;

  function add(part: string | Uint8Array) {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    cursor += bytes.length;
  }

  function obj(body: string | Uint8Array[]) {
    offsets.push(cursor);
    if (typeof body === "string") add(body);
    else for (const part of body) add(part);
  }

  add("%PDF-1.4\n");
  obj("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
  obj("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");
  obj(
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >> endobj\n`,
  );
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q\n`;
  obj(`4 0 obj << /Length ${content.length} >> stream\n${content}endstream endobj\n`);
  obj([
    enc.encode(
      `5 0 obj << /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >> stream\n`,
    ),
    jpeg,
    enc.encode("\nendstream endobj\n"),
  ]);

  const xrefAt = cursor;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  add(xref);
  add(`trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(cursor);
  let o = 0;
  for (const part of chunks) {
    out.set(part, o);
    o += part.length;
  }
  return new Blob([out], { type: "application/pdf" });
}
