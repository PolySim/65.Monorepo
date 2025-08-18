"use client";

import { FormInput } from "@/components/form/formInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { config } from "@/config/config";
import { compressor } from "@/lib/compressor";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import {
  useCreateImage,
  useDeleteImage,
  useRotateImage,
} from "@/queries/image.queries";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
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
  const mainImageId = hike?.mainImage?.id;

  const [isPending, startTransition] = useTransition();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: [] as unknown as FileList,
    },
  });

  const { mutate: createImage } = useCreateImage();
  const { mutate: deleteImage } = useDeleteImage();
  const { mutate: rotateImage } = useRotateImage();
  const { mutate: updateHike } = useUpdateHike();

  const onSetMainImage = (imageId: string) => {
    updateHike({
      mainImageId: imageId,
    });
  };

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
                src={`${config.IMAGE_URL}?path=${image.path}&rotate=${image.rotate ?? 0}`}
                alt={`Photo ${index + 1}`}
                className="aspect-video object-cover rounded-lg w-full"
                width={576}
                height={384}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-around gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteImage(image.id)}
                  disabled={mainImageId === image.id}
                >
                  <Trash2 size={20} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => onSetMainImage(image.id)}
                  disabled={mainImageId === image.id}
                >
                  <ImageIcon size={20} />
                </Button>
                <Button size="icon" onClick={() => rotateImage(image.id)}>
                  <RotateCcw size={20} />
                </Button>
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
