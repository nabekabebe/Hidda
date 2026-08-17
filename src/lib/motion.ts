import { createContext, useContext } from "react";

export const ReducedMotionContext = createContext(false);

export function usePrefersReduced(): boolean {
  return useContext(ReducedMotionContext);
}
