import { Button } from "@/components/ui/Button";
import type { MediaItem, MediaKind } from "@/domain/types";
import { draftFromPerson, useFamilyStore } from "@/store/useFamilyStore";
import { deleteMediaBlob, getMediaBlob, getMediaObjectUrl, putMediaBlob } from "@/lib/mediaStore";
import { useEffect, useState } from "react";

export function PersonGallery({ personId }: { personId: string }) {
  const media = useFamilyStore((s) => s.media);
  const saveMedia = useFamilyStore((s) => s.saveMedia);
  const savePerson = useFamilyStore((s) => s.savePerson);
  const people = useFamilyStore((s) => s.people);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const mine = media.filter((item) => item.personIds.includes(personId));
  const person = people.find((item) => item.id === personId);

  async function addFile(file: File, kind: MediaKind) {
    const item: MediaItem = {
      id: crypto.randomUUID(),
      kind,
      personIds: [personId],
      caption: file.name.replace(/\.[^.]+$/, ""),
      mimeType: file.type,
      blobKey: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await putMediaBlob(item.blobKey, file);
    await saveMedia([...media, item]);
  }

  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Gallery</h3>
      <ul className="grid grid-cols-2 gap-2">
        {mine.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            canEdit={canEdit}
            onPortrait={
              person && item.kind === "photo"
                ? async () => {
                    const blob = await getMediaBlob(item.blobKey);
                    if (!blob || !person) return;
                    const avatar = await blobToDataUrl(blob);
                    await savePerson(person.id, { ...draftFromPerson(person), avatar });
                  }
                : undefined
            }
            onRemove={
              canEdit
                ? async () => {
                    await deleteMediaBlob(item.blobKey);
                    await saveMedia(media.filter((entry) => entry.id !== item.id));
                  }
                : undefined
            }
          />
        ))}
      </ul>
      {canEdit ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--ink)_16%,transparent)] px-3 py-1 text-xs">
            Add photo
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => event.target.files?.[0] && void addFile(event.target.files[0], "photo")} />
          </label>
          <label className="inline-flex cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--ink)_16%,transparent)] px-3 py-1 text-xs">
            Add document
            <input type="file" accept="image/*,.pdf,.txt" className="sr-only" onChange={(event) => event.target.files?.[0] && void addFile(event.target.files[0], "document")} />
          </label>
        </div>
      ) : null}
    </section>
  );
}

function GalleryCard({
  item,
  canEdit,
  onPortrait,
  onRemove,
}: {
  item: MediaItem;
  canEdit: boolean;
  onPortrait?: () => void;
  onRemove?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    void getMediaObjectUrl(item.blobKey).then(setSrc);
  }, [item.blobKey]);
  return (
    <li className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--ink)_10%,transparent)]">
      {src && item.mimeType.startsWith("image/") ? (
        <img src={src} alt={item.caption} className="h-24 w-full object-cover" />
      ) : (
        <div className="grid h-24 place-items-center text-xs text-[var(--muted)]">{item.kind}</div>
      )}
      <p className="truncate px-2 py-1 text-xs">{item.caption}</p>
      {canEdit ? (
        <div className="flex gap-1 px-2 pb-2">
          {onPortrait ? (
            <Button type="button" tone="ghost" className="px-2 py-1 text-xs" onClick={onPortrait}>
              Portrait
            </Button>
          ) : null}
          {onRemove ? (
            <Button type="button" tone="ghost" className="px-2 py-1 text-xs" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
