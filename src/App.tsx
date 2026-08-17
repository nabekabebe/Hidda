import { HomePage } from "@/components/app/HomePage";
import { TreePage } from "@/components/app/TreePage";
import { ReducedMotionContext } from "@/lib/motion";
import { useAccountStore } from "@/store/useAccountStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster, toast } from "sonner";

function OwnerHydrate({ children }: { children: ReactNode }) {
  const hydrate = useFamilyStore((s) => s.hydrate);
  const hydrateAccount = useAccountStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAccount();
    void hydrate();
  }, [hydrate, hydrateAccount]);

  return children;
}

function ShareRoute() {
  const { token } = useParams();
  const hydrateShare = useFamilyStore((s) => s.hydrateShare);

  useEffect(() => {
    if (!token) return;
    void hydrateShare(token).then((ok) => {
      if (!ok) toast.error("This share link was not found.");
    });
  }, [token, hydrateShare]);

  return <TreePage />;
}

export default function App() {
  const theme = useFamilyStore((s) => s.theme);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <ReducedMotionContext.Provider value={Boolean(reduce)}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <OwnerHydrate>
                <HomePage />
              </OwnerHydrate>
            }
          />
          <Route
            path="/tree"
            element={
              <OwnerHydrate>
                <TreePage />
              </OwnerHydrate>
            }
          />
          <Route path="/s/:token" element={<ShareRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme={theme} position="bottom-center" richColors />
    </ReducedMotionContext.Provider>
  );
}
