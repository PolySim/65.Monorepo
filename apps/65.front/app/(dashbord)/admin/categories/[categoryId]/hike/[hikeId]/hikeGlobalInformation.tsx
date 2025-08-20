"use client";

import { FormInput } from "@/components/form/formInput";
import { Form } from "@/components/ui/form";
import useDebounce from "@/hook/useDebonce";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, MapPin, Mountain } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  distance: z.number().optional(),
  duration: z.string().optional(),
  elevation: z.number().optional(),
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
  const { mutate: updateHike } = useUpdateHike();

  const onChange = (data: FormSchema) => {
    const currentValues = form.getValues();
    if (
      currentValues.distance !== data.distance ||
      currentValues.duration !== data.duration ||
      currentValues.elevation !== data.elevation
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
        className="p-6 bg-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Distance (km)</div>
              <FormInput name="distance" type="number" min={0} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock size={24} className="text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Durée</div>
              <FormInput name="duration" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mountain size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Dénivelé (m)</div>
              <FormInput name="elevation" type="number" min={0} />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default HikeGlobalInformation;
