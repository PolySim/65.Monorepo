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
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  name: z.string().min(1),
  difficulty: z.string().optional(),
  state: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export default function CreateCategory() {
  const { data: categories } = useCategories();
  const { categoryId } = useAppParams();
  const { data: difficulties } = useDifficulties();
  const states = categories?.find(
    (category) => category.id === categoryId
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
    console.log(data);
    createHike({
      title: data.name,
      difficultyId: data.difficulty ?? "-1",
      stateId: data.state ?? "-1",
      categoryId,
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-3 gap-4"
        >
          <FormInput
            name="name"
            label="Nom"
            placeholder="Nom de l'activité"
            disabled={isPending}
          />
          {difficulties && (
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
          )}
          {states && states.length > 0 && (
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
          )}
        </form>
      </Form>
      <DialogFooter>
        <Button
          disabled={isPending}
          onClick={() => onSubmit(form.getValues())}
          type="button"
        >
          Créer
        </Button>
        <DialogClose asChild>
          <Button
            onClick={() => console.log("hiii")}
            variant="outline"
            disabled={isPending}
          >
            Annuler
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
