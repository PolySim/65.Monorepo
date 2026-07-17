"use client";

import { FormInput } from "@/components/form/formInput";
import { FormSelect } from "@/components/form/formSelect";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAppParams } from "@/hook/useAppParams";
import { useCategories } from "@/queries/categories.queries";
import { useDifficulties } from "@/queries/difficulty.query";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Renseignez le nom de l’activité"),
  difficulty: z.string().optional(),
  state: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export default function HikeUpdateInformation({
  onUpdated,
}: {
  onUpdated: () => void;
}) {
  const { data: categories } = useCategories();
  const { data: hike } = useHikeById();
  const { categoryId } = useAppParams();
  const { data: difficulties } = useDifficulties();
  const states = categories?.find(
    (category) => category.id === categoryId,
  )?.states;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: hike?.title ?? "",
      difficulty: hike?.difficulty?.id ?? "",
      state: hike?.state?.id ?? "",
    },
  });
  const { mutate: updateHike, isPending } = useUpdateHike();

  const onSubmit = (data: FormSchema) => {
    updateHike(
      {
        title: data.name,
        difficultyId: data.difficulty ?? "-1",
        stateId: data.state ?? "-1",
      },
      {
        onSuccess: (result) => {
          if (result.success) onUpdated();
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormInput
              name="name"
              label="Nom de l’activité"
              placeholder="Ex. Boucle du pic du Midi"
              autoFocus
            />
          </div>
          {difficulties && (
            <FormSelect
              name="difficulty"
              label="Difficulté"
              className="w-full"
              placeholder="Choisir une difficulté"
              options={difficulties.map((difficulty) => ({
                value: difficulty.id,
                label: difficulty.name,
              }))}
            />
          )}
          {states && states.length > 0 && (
            <FormSelect
              name="state"
              label="Massif ou secteur"
              className="w-full"
              placeholder="Choisir un massif"
              options={states.map((state) => ({
                value: state.id,
                label: state.name,
              }))}
            />
          )}
        </div>

        <DialogFooter className="border-t border-border pt-5">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
