import { Button } from "@/components/ui/Button";
import { useAccountStore } from "@/store/useAccountStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useState } from "react";
import { toast } from "sonner";

export function AuthPanel() {
  const user = useAccountStore((s) => s.user);
  const trees = useAccountStore((s) => s.trees);
  const currentTreeId = useAccountStore((s) => s.currentTreeId);
  const login = useAccountStore((s) => s.login);
  const register = useAccountStore((s) => s.register);
  const logout = useAccountStore((s) => s.logout);
  const addTree = useAccountStore((s) => s.addTree);
  const selectTree = useAccountStore((s) => s.selectTree);
  const hydrateFamily = useFamilyStore((s) => s.hydrate);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [treeName, setTreeName] = useState("");

  async function reloadTree() {
    await hydrateFamily();
  }

  if (user) {
    return (
      <section className="glass grid gap-4 rounded-[28px] p-5">
        <div>
          <p className="catalog text-2xl text-[var(--bone)]">{user.name}</p>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>
        <div className="grid gap-2">
          <p className="catalog text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Atlases</p>
          {trees.map((tree) => (
            <button
              key={tree.id}
              type="button"
              onClick={() => {
                selectTree(tree.id);
                void reloadTree();
              }}
              className={
                tree.id === currentTreeId
                  ? "rounded-2xl bg-[var(--gold)] px-3 py-2 text-left text-sm text-[var(--sky-deep)]"
                  : "rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-2 text-left text-sm"
              }
            >
              {tree.name}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addTree(treeName || "New atlas");
            setTreeName("");
            void reloadTree();
          }}
        >
          <input
            value={treeName}
            onChange={(event) => setTreeName(event.target.value)}
            placeholder="New atlas name"
            className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2 text-sm outline-none"
          />
          <Button type="submit">Add</Button>
        </form>
        <Button
          tone="ghost"
          onClick={() => {
            logout();
            void reloadTree();
          }}
        >
          Sign out
        </Button>
      </section>
    );
  }

  return (
    <section className="glass grid gap-4 rounded-[28px] p-5">
      <p className="catalog text-2xl text-[var(--bone)]">{mode === "in" ? "Sign in" : "Create an account"}</p>
      <p className="text-sm text-[var(--muted)]">
        Save more than one atlas on this device. Linking Postgres later keeps the same email across phones.
      </p>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void (mode === "in" ? login(email, password) : register({ email, name, password }))
            .then(() => {
              toast.success(mode === "in" ? "Welcome back" : "Atlas saved to this account");
              void reloadTree();
            })
            .catch((error: unknown) => {
              toast.error(error instanceof Error ? error.message : "Could not sign in");
            });
        }}
      >
        {mode === "up" ? (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2 outline-none"
          />
        ) : null}
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2 outline-none"
        />
        <Button type="submit">{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
      <button type="button" className="text-sm text-[var(--gold)]" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account?" : "Already have an account?"}
      </button>
    </section>
  );
}
