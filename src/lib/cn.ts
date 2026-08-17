export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_INOUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

export const springSoft = { type: "spring" as const, duration: 0.5, bounce: 0.16 };
export const springSnap = { type: "spring" as const, duration: 0.38, bounce: 0.1 };
