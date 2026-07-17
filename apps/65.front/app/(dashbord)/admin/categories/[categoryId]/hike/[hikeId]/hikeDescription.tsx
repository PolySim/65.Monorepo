"use client";

import { FormArea } from "@/components/form/formArea";
import { Form } from "@/components/ui/form";
import useDebounce from "@/hook/useDebonce";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  content: z.string(),
  indication: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const HikeDescription = () => {
  const [activeTab, setActiveTab] = useState<"description" | "indications">(
    "description",
  );
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

  const { mutate: updateHike, isPending: isSaving } = useUpdateHike();

  const saveContent = (data: FormSchema) => {
    updateHike(data);
  };

  const {
    cancel: cancelAutosave,
    flush: flushAutosave,
    schedule: queueAutosave,
  } = useDebounce(() => {
    void form.handleSubmit(saveContent)();
  }, 1000);

  const onSubmit = (data: FormSchema) => {
    cancelAutosave();
    saveContent(data);
  };

  useEffect(() => () => flushAutosave(), [flushAutosave]);

  return (
    <section
      id="hike-content"
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="hike-content-title"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
        <p
          className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          {isSaving ? "Enregistrement…" : "Enregistrement automatique"}
        </p>
      </div>

      <Form {...form}>
        <form
          onChange={() => queueAutosave()}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div
            className="mb-5 flex gap-1 overflow-x-auto border-b border-border"
            role="tablist"
            aria-label="Type de contenu"
          >
            <button
              id="description-tab"
              type="button"
              role="tab"
              aria-selected={activeTab === "description"}
              aria-controls="description-panel"
              onClick={() => setActiveTab("description")}
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
              aria-controls="indications-panel"
              onClick={() => setActiveTab("indications")}
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

          {activeTab === "description" && (
            <div
              id="description-panel"
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
          )}

          {activeTab === "indications" && (
            <div
              id="indications-panel"
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
          )}
        </form>
      </Form>
    </section>
  );
};

export default HikeDescription;
