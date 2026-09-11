"use client";

import { FormInput } from "@/components/form/formInput";
import { Form } from "@/components/ui/form";
import { useAdminAutosave } from "@/hook/useAdminAutosave";
import AutosaveStatus from "@/components/admin/autosaveStatus";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, MapPin, Mountain } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  distance: z
    .number({ error: "Renseignez une distance valide" })
    .min(0, "La distance doit être positive"),
  duration: z.string().optional(),
  elevation: z
    .number({ error: "Renseignez un dénivelé valide" })
    .min(0, "Le dénivelé doit être positif"),
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
  const { mutateAsync: updateHike } = useUpdateHike();
  const { status, schedule, flush } = useAdminAutosave(form, updateHike);

  return (
    <section
      id="essential-information"
      className="surface scroll-mt-24 p-5 sm:p-6"
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
        <AutosaveStatus status={status} onRetry={flush} />
      </div>

      <Form {...form}>
        <form
          onChange={schedule}
          onSubmit={(event) => {
            event.preventDefault();
            flush();
          }}
          className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-alpine-soft text-alpine">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <FormInput
                name="distance"
                value={
                  Number.isNaN(form.watch("distance"))
                    ? ""
                    : form.watch("distance")
                }
                label="Distance (km)"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                onChange={(value) =>
                  form.setValue(
                    "distance",
                    value === "" ? NaN : Number(value),
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
                value={
                  Number.isNaN(form.watch("elevation"))
                    ? ""
                    : form.watch("elevation")
                }
                label="Dénivelé positif (m)"
                type="number"
                min={0}
                inputMode="numeric"
                onChange={(value) =>
                  form.setValue(
                    "elevation",
                    value === "" ? NaN : Number(value),
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
