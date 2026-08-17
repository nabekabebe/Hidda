import { useFamilyStore } from "@/store/useFamilyStore";
import { displayName } from "@/domain/types";

export function ContextMenu({
  personId,
  x,
  y,
  onClose,
}: {
  personId: string;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const person = useFamilyStore((s) => s.people.find((item) => item.id === personId));
  const openProfile = useFamilyStore((s) => s.openProfile);
  const openForm = useFamilyStore((s) => s.openForm);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const toggleCollapsed = useFamilyStore((s) => s.toggleCollapsed);
  const setPanel = useFamilyStore((s) => s.setPanel);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  if (!person) return null;

  const items = [
    { label: "View profile", run: () => openProfile(person.id) },
    ...(canEdit
      ? [
          { label: "Edit person", run: () => openForm({ personId: person.id }) },
          { label: "Add parent", run: () => openForm({ fromId: person.id, relation: "parent" as const }) },
          { label: "Add child", run: () => openForm({ fromId: person.id, relation: "child" as const }) },
          { label: "Add spouse", run: () => openForm({ fromId: person.id, relation: "spouse" as const }) },
          { label: "Add sibling", run: () => openForm({ fromId: person.id, relation: "sibling" as const }) },
        ]
      : []),
    { label: "Focus on this person", run: () => centerOn(person.id) },
    { label: "Collapse branch", run: () => toggleCollapsed(person.id) },
    {
      label: "Copy link",
      run: () => {
        void navigator.clipboard.writeText(`${window.location.origin}/tree?focus=${person.id}`);
      },
    },
    ...(canEdit ? [{ label: "Delete", run: () => setPanel({ type: "confirm-delete" as const, personId: person.id }) }] : []),
  ];

  return (
    <div
      className="glass fixed z-50 min-w-52 overflow-hidden rounded-2xl p-1"
      style={{ left: x, top: y, transformOrigin: "top left" }}
      role="menu"
      aria-label={`Actions for ${displayName(person)}`}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="block w-full rounded-xl px-3 py-2 text-left text-sm"
          onClick={() => {
            item.run();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
