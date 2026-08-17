import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Tone = "gold" | "ghost" | "danger";

export function Button({
  tone = "gold",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[transform,background-color,color,opacity] duration-150 ease-[var(--ease-out)] disabled:opacity-40",
        tone === "gold" && "bg-[var(--gold)] text-[var(--sky-deep)]",
        tone === "ghost" && "bg-transparent text-[var(--ink)] border border-[color-mix(in_srgb,var(--ink)_16%,transparent)]",
        tone === "danger" && "bg-[var(--danger)] text-[var(--sky-deep)]",
        className,
      )}
      {...props}
    />
  );
}
