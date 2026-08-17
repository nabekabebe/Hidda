import { PersonForm } from "@/components/person/PersonForm";
import { Button } from "@/components/ui/Button";
import { emptyDraft } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { toast } from "sonner";

export function EmptySky() {
  const savePerson = useFamilyStore((s) => s.savePerson);
  const resetDemo = useFamilyStore((s) => s.resetDemo);
  const openForm = useFamilyStore((s) => s.openForm);
  const panel = useFamilyStore((s) => s.panel);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="catalog text-5xl text-[var(--bone)] md:text-6xl">Start your family story</p>
      <p className="mt-4 max-w-[36ch] text-[var(--muted)]">Every family has a sky. Place the first star, then grow parents, partners, siblings, and children from there.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => openForm()}>Add yourself</Button>
        <Button
          tone="ghost"
          onClick={async () => {
            await resetDemo();
            toast.success("Loaded a sample family (synthetic)");
          }}
        >
          Explore a sample family
        </Button>
      </div>
      {panel.type === "form" ? (
        <div className="glass mt-8 w-full max-w-lg rounded-[28px] p-5 text-left">
          <PersonForm
            initial={emptyDraft()}
            submitLabel="Place in the sky"
            onCancel={() => useFamilyStore.getState().closePanel()}
            onSubmit={async (draft) => {
              await savePerson(undefined, draft);
              toast.success("First star placed");
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
