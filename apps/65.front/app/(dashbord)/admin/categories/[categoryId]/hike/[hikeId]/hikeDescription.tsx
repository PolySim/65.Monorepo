"use client";

import { FormArea } from "@/components/form/formArea";
import { Form } from "@/components/ui/form";
import { useAdminAutosave } from "@/hook/useAdminAutosave";
import AutosaveStatus from "@/components/admin/autosaveStatus";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  content: z.string(),
  indication: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const HikeDescription = ({
  activeTab,
  onTabChange,
}: {
  activeTab: "description" | "indications";
  onTabChange: (tab: "description" | "indications") => void;
}) => {
  const { data: hike } = useHikeById({
    select: (data) => {
      return {
        content: data.data?.content,
        indication: data.data?.indication,
      };
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: hike?.content ?? "",
      indication: hike?.indication ?? "",
    },
  });

  const { mutateAsync: updateHike } = useUpdateHike();
  const { status, schedule, flush } = useAdminAutosave(form, updateHike);

  useEffect(() => {
    const syncTab = () => {
      if (window.location.hash === "#indications-panel")
        onTabChange("indications");
      if (window.location.hash === "#description-panel")
        onTabChange("description");
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, [onTabChange]);

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "description"
        : event.key === "End"
          ? "indications"
          : activeTab === "description"
            ? "indications"
            : "description";
    onTabChange(next);
    document.getElementById(`${next}-tab`)?.focus();
  };

  return (
    <section
      id="hike-content"
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="hike-content-title"
    >
      <div className="mb-5 flex flex-col items-start gap-3">
        <div>
          <h2
            id="hike-content-title"
            className="text-lg font-semibold tracking-[-0.015em]"
          >
            Contenu de l’itinéraire
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Rédigez des informations courtes, concrètes et utiles avant le
            départ.
          </p>
        </div>
        <AutosaveStatus status={status} onRetry={flush} />
      </div>

      <Form {...form}>
        <form
          onChange={schedule}
          onSubmit={(event) => {
            event.preventDefault();
            flush();
          }}
        >
          <div
            className="mb-5 flex gap-1 overflow-x-auto border-b border-border"
            role="tablist"
            onKeyDown={onTabKeyDown}
            aria-label="Type de contenu"
          >
            <button
              id="description-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === "description"}
              tabIndex={activeTab === "description" ? 0 : -1}
              aria-controls="description-panel"
              onClick={() => onTabChange("description")}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium outline-none transition-[border-color,color,background-color] duration-150 focus-visible:rounded-t-lg focus-visible:ring-[3px] focus-visible:ring-ring/20 ${
                activeTab === "description"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <Info className="size-4" aria-hidden="true" />
              Description
            </button>

            <button
              id="indications-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === "indications"}
              tabIndex={activeTab === "indications" ? 0 : -1}
              aria-controls="indications-panel"
              onClick={() => onTabChange("indications")}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium outline-none transition-[border-color,color,background-color] duration-150 focus-visible:rounded-t-lg focus-visible:ring-[3px] focus-visible:ring-ring/20 ${
                activeTab === "indications"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
              Indications
            </button>
          </div>

          <div
            id="description-panel"
            hidden={activeTab !== "description"}
            className="scroll-mt-28"
            role="tabpanel"
            aria-labelledby="description-tab"
          >
            <FormArea
              name="content"
              label="Description publique"
              description="Présentez le parcours, ses points forts et le terrain rencontré."
              placeholder="Décrivez le parcours, son ambiance et ses principaux repères…"
              className="min-h-56 resize-y"
            />
          </div>

          <div
            id="indications-panel"
            hidden={activeTab !== "indications"}
            className="scroll-mt-28"
            role="tabpanel"
            aria-labelledby="indications-tab"
          >
            <FormArea
              name="indication"
              label="Consignes et points d’attention"
              description="Signalez l’accès, le balisage, les passages délicats et les précautions."
              placeholder="Ajoutez les informations utiles avant le départ…"
              className="min-h-56 resize-y"
            />
          </div>
        </form>
      </Form>
    </section>
  );
};

export default HikeDescription;
