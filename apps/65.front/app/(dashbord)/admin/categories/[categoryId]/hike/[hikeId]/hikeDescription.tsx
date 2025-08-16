"use client";

import { FormArea } from "@/components/form/formArea";
import { Form } from "@/components/ui/form";
import useDebounce from "@/hook/useDebonce";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  content: z.string(),
  indication: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const HikeDescription = () => {
  const [activeTab, setActiveTab] = useState<"description" | "indications">(
    "description"
  );
  const { data: hike } = useHikeById();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: hike?.content ?? "",
      indication: hike?.indication ?? "",
    },
  });

  const { mutate: updateHike } = useUpdateHike();

  const onChange = (data: FormSchema) => {
    const currentValues = form.getValues();
    if (
      currentValues.content !== data.content ||
      currentValues.indication !== data.indication
    )
      return;
    updateHike(data);
  };

  const onSubmit = useDebounce(onChange, 1000);

  return (
    <Form {...form}>
      <form
        onChange={() => onSubmit(form.getValues())}
        onSubmit={(e) => e.preventDefault()}
        className="px-4 bg-white"
      >
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "description"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Info size={16} />
                Description
              </div>
            </button>

            <button
              onClick={() => setActiveTab("indications")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "indications"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                Indications
              </div>
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === "description" && (
          <FormArea
            name="content"
            label="Description"
            placeholder="Description de l'itinéraire ..."
            className="min-h-[200px]"
          />
        )}

        {activeTab === "indications" && (
          <FormArea
            name="indication"
            label="Indications"
            placeholder="Indications pour l'itinéraire ..."
            className="min-h-[200px]"
          />
        )}
      </form>
    </Form>
  );
};

export default HikeDescription;
