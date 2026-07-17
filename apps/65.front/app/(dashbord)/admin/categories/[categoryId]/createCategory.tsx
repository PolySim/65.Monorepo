"use client";

import { FormInput } from "@/components/form/formInput";
import { FormSelect } from "@/components/form/formSelect";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAppParams } from "@/hook/useAppParams";
import { useCategories } from "@/queries/categories.queries";
import { useDifficulties } from "@/queries/difficulty.query";
import { useCreateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Le nom de l’activité est obligatoire"),
  difficulty: z.string().optional(),
  state: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export default function CreateCategory() {
  const { data: categories } = useCategories();
  const { categoryId } = useAppParams();
  const { data: difficulties } = useDifficulties();
  const states = categories?.find(
    (category) => category.id === categoryId,
  )?.states;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      difficulty: difficulties?.[0]?.id ?? "",
      state: states?.[0]?.id ?? "",
    },
  });
  const { mutate: createHike, isPending } = useCreateHike();

  const onSubmit = (data: FormSchema) => {
    createHike({
      title: data.name,
      difficultyId: data.difficulty ?? "-1",
      stateId: data.state ?? "-1",
      categoryId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            name="name"
            label="Nom de l’activité"
            placeholder="Ex. Pic du Midi par le col…"
            disabled={isPending}
            itemClassName="sm:col-span-2"
            autoFocus
          />
          {difficulties ? (
            <FormSelect
              name="difficulty"
              label="Difficulté"
              className="w-full"
              disabled={isPending}
              options={difficulties.map((difficulty) => ({
                value: difficulty.id,
                label: difficulty.name,
              }))}
            />
          ) : null}
          {states && states.length > 0 ? (
            <FormSelect
              name="state"
              label="Massif"
              className="w-full"
              disabled={isPending}
              options={states.map((state) => ({
                value: state.id,
                label: state.name,
              }))}
            />
          ) : null}
        </div>

        <DialogFooter className="mt-7">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending} static>
              Annuler
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            static={isPending}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Création…" : "Créer l’activité"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
