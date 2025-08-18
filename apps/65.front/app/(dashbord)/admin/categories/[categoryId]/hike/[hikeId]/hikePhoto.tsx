"use client";

import { FormInput } from "@/components/form/formInput";
import { Form } from "@/components/ui/form";
import { config } from "@/config/config";
import { compressor } from "@/lib/compressor";
import { useCreateImage, useHikeById } from "@/queries/hike.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Upload, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  image: z.instanceof(FileList).refine(
    (files) => {
      return Array.from(files).every((file) => file.type.startsWith("image/"));
    },
    {
      message: "Le fichier doit être une image",
    }
  ),
});

type FormSchema = z.infer<typeof formSchema>;

const HikePhoto = () => {
  const { data: hike } = useHikeById();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: [] as unknown as FileList,
    },
  });

  const { mutate: createImage } = useCreateImage();

  const onSubmit = (data: FileList | null) => {
    if (!data) return;
    startTransition(async () => {
      const compressedImages = await Promise.all(
        Array.from(data).map(async (image) => {
          return await compressor({
            file: image,
            maxSize: 2_000_000,
            quality: 0.95,
          });
        })
      );
      const formData = new FormData();
      compressedImages.forEach((compressedImage) => {
        formData.append("images", compressedImage);
      });
      await createImage(formData);
    });
  };

  return (
    <div className="p-6 bg-white mt-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Camera size={24} />
        Photos ({hike?.images.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {hike?.images
          .sort((a, b) => a.ordered - b.ordered)
          .map((image, index) => (
            <div key={index} className="relative group cursor-pointer">
              <Image
                src={`${config.IMAGE_URL}?path=${image.path}`}
                alt={`Photo ${index + 1}`}
                className="aspect-video object-cover rounded-lg w-full"
                width={576}
                height={384}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
                <ZoomIn
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative group cursor-pointer"
          >
            <FormInput
              type="file"
              name="image"
              className="hidden"
              multiple
              onFilesChange={(e) => onSubmit(e.target.files)}
              ref={inputRef}
              accept="image/*"
            />
            <div
              onClick={() => inputRef.current?.click()}
              className="aspect-video object-cover rounded-lg w-full border border-dashed border-primary flex flex-col items-center justify-center gap-2"
            >
              <Upload size={24} className="text-primary" />
              <p className="text-primary">Ajouter une photo</p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default HikePhoto;
