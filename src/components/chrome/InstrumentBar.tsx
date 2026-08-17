import { cn } from "@/lib/cn";
import { useFamilyStore } from "@/store/useFamilyStore";
import {
  ArrowsOut,
  DotsThree,
  Funnel,
  House,
  Keyboard,
  List,
  MagnifyingGlass,
  Minus,
  Moon,
  Plus,
  ShareNetwork,
  SquaresFour,
  Sun,
  TextT,
  Tree,
  UserPlus,
  Crosshair,
  BookOpen,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";

export function InstrumentBar() {
  const navigate = useNavigate();
  const fitTree = useFamilyStore((s) => s.fitTree);
  const setPanel = useFamilyStore((s) => s.setPanel);
  const selectedId = useFamilyStore((s) => s.selectedId);
  const openProfile = useFamilyStore((s) => s.openProfile);
  const expandAll = useFamilyStore((s) => s.expandAll);
  const collapseAll = useFamilyStore((s) => s.collapseAll);
  const theme = useFamilyStore((s) => s.theme);
  const setTheme = useFamilyStore((s) => s.setTheme);
  const focusMode = useFamilyStore((s) => s.focusMode);
  const setFocusMode = useFamilyStore((s) => s.setFocusMode);
  const setViewport = useFamilyStore((s) => s.setViewport);
  const viewport = useFamilyStore((s) => s.viewport);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const placingLabel = useFamilyStore((s) => s.placingLabel);
  const setPlacingLabel = useFamilyStore((s) => s.setPlacingLabel);
  const [more, setMore] = useState(false);

  return (
    <div className="relative">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-[28px] p-2 md:flex-col">
        <Tool gold icon={<MagnifyingGlass size={18} />} label="Search" shortcut="⌘K" onClick={() => setPanel({ type: "search" })} />
        <Tool gold icon={<Plus size={18} />} label="Zoom in" shortcut="+" onClick={() => setViewport({ ...viewport, k: Math.min(1.8, viewport.k * 1.12) })} />
        <Tool gold icon={<Minus size={18} />} label="Zoom out" shortcut="-" onClick={() => setViewport({ ...viewport, k: Math.max(0.28, viewport.k / 1.12) })} />
        <Tool gold icon={<ArrowsOut size={18} />} label="Fit tree" shortcut="F" onClick={fitTree} />
        {canEdit ? (
          <Tool gold icon={<TextT size={18} />} label="Place a label" shortcut="T" onClick={() => setPlacingLabel(!placingLabel)} active={placingLabel} />
        ) : null}
        <Tool gold icon={<ShareNetwork size={18} />} label="Share and export" onClick={() => setPanel({ type: "share" })} />
        <Tool gold icon={<List size={18} />} label="Charts and lists" onClick={() => setPanel({ type: "views" })} />
        <Tool gold icon={<House size={18} />} label="Home" shortcut="H" onClick={() => navigate("/")} />
        {selectedId ? (
          <Tool gold icon={<BookOpen size={18} />} label="Open catalog" onClick={() => openProfile(selectedId)} className="md:hidden" />
        ) : null}
        <Tool icon={<DotsThree size={18} />} label="More tools" onClick={() => setMore((value) => !value)} active={more} />
      </div>
      {more ? (
        <div className="glass pointer-events-auto absolute left-1/2 top-14 z-30 flex -translate-x-1/2 items-center gap-1 rounded-[24px] p-2 md:left-14 md:top-0 md:translate-x-0 md:flex-col">
          {canEdit ? (
            <Tool icon={<UserPlus size={18} />} label="Add person" shortcut="N" onClick={() => useFamilyStore.getState().openForm({ fromId: selectedId ?? undefined })} />
          ) : null}
          <Tool icon={<Tree size={18} />} label="Expand all" onClick={expandAll} />
          <Tool icon={<SquaresFour size={18} />} label="Collapse all" onClick={collapseAll} />
          <Tool icon={<Funnel size={18} />} label="Filters" onClick={() => setPanel({ type: "filters" })} />
          <Tool icon={<Crosshair size={18} />} label="Focus mode" onClick={() => setFocusMode(!focusMode)} active={focusMode} />
          <Tool icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} label={theme === "dark" ? "Day chart" : "Night atlas"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
          <Tool icon={<Keyboard size={18} />} label="Shortcuts" onClick={() => setPanel({ type: "shortcuts" })} />
        </div>
      ) : null}
    </div>
  );
}

function Tool({
  icon,
  label,
  shortcut,
  onClick,
  active,
  gold,
  className,
}: {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
  gold?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      title={shortcut ? `${label} · ${shortcut}` : label}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        gold ? "text-[var(--gold)]" : "text-[var(--bone)]",
        active && "bg-[color-mix(in_srgb,var(--gold)_22%,transparent)] text-[var(--gold)]",
        className,
      )}
    >
      {icon}
    </button>
  );
}
