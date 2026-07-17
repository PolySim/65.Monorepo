"use client";

import { FormInput } from "@/components/form/formInput";
import { Form } from "@/components/ui/form";
import useDebounce from "@/hook/useDebonce";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, MapPin, Mountain } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  distance: z.number().min(0, "La distance doit être positive").optional(),
  duration: z.string().optional(),
  elevation: z.number().min(0, "Le dénivelé doit être positif").optional(),
});

type FormSchema = z.infer<typeof formSchema>;

const HikeGlobalInformation = () => {
  const { data: hike } = useHikeById({
    select: (data) => {
      return {
        distance: data.data?.distance,
        duration: data.data?.duration,
        elevation: data.data?.elevation,
      };
    },
  });
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: hike?.distance ?? 0,
      duration: hike?.duration ?? "",
      elevation: hike?.elevation ?? 0,
    },
  });
  const { mutate: updateHike, isPending: isSaving } = useUpdateHike();

  const saveInformation = (data: FormSchema) => {
    updateHike(data);
  };

  const {
    cancel: cancelAutosave,
    flush: flushAutosave,
    schedule: queueAutosave,
  } = useDebounce(() => {
    void form.handleSubmit(saveInformation)();
  }, 1000);

  const onSubmit = (data: FormSchema) => {
    cancelAutosave();
    saveInformation(data);
  };

  useEffect(() => () => flushAutosave(), [flushAutosave]);

  return (
    <section
      className="surface p-5 sm:p-6"
      aria-labelledby="essential-information-title"
    >
      <div className="mb-5 flex flex-col items-start gap-3">
        <div>
          <h2
            id="essential-information-title"
            className="text-lg font-semibold tracking-[-0.015em]"
          >
            Informations essentielles
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Ces données apparaissent dans les listes et sur la fiche publique.
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
          className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-alpine-soft text-alpine">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <FormInput
                name="distance"
                label="Distance (km)"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                onChange={(value) =>
                  form.setValue(
                    "distance",
                    value === "" ? undefined : Number(value),
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              />
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
              <Clock className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <FormInput
                name="duration"
                label="Durée"
                placeholder="Ex. 2 h 30"
              />
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sunrise-soft text-sunrise">
              <Mountain className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <FormInput
                name="elevation"
                label="Dénivelé positif (m)"
                type="number"
                min={0}
                inputMode="numeric"
                onChange={(value) =>
                  form.setValue(
                    "elevation",
                    value === "" ? undefined : Number(value),
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              />
            </div>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default HikeGlobalInformation;
