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
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  difficulty: z.string().optional(),
  state: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export default function HikeUpdateInformation() {
  const { data: categories } = useCategories();
  const { data: hike } = useHikeById();
  const { categoryId } = useAppParams();
  const { data: difficulties } = useDifficulties();
  const states = categories?.find(
    (category) => category.id === categoryId
  )?.states;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: hike?.title ?? "",
      difficulty: hike?.difficulty.id ?? "",
      state: hike?.state.id ?? "",
    },
  });
  const { mutate: updateHike } = useUpdateHike();

  const onSubmit = (data: FormSchema) => {
    updateHike({
      title: data.name,
      difficultyId: data.difficulty ?? "-1",
      stateId: data.state ?? "-1",
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-3 gap-4"
        >
          <FormInput name="name" label="Nom" placeholder="Nom de l'activité" />
          {difficulties && (
            <FormSelect
              name="difficulty"
              label="Difficulté"
              className="w-full"
              options={difficulties.map((difficulty) => ({
                value: difficulty.id,
                label: difficulty.name,
              }))}
            />
          )}
          {states && states.length > 0 && (
            <FormSelect
              name="state"
              label="Massif"
              className="w-full"
              options={states.map((state) => ({
                value: state.id,
                label: state.name,
              }))}
            />
          )}
        </form>
      </Form>
      <DialogFooter>
        <DialogClose asChild>
          <Button onClick={() => onSubmit(form.getValues())} type="button">
            Modifier
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button variant="outline">Annuler</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
