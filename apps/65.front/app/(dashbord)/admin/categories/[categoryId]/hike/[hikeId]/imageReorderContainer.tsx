"use client";

import { FormInput } from "@/components/form/formInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { config } from "@/config/config";
import { Image as ImageType } from "@/model/image.model";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import {
  useCreateImageByChunks,
  useDeleteImage,
  useReorderImage,
  useRotateImage,
} from "@/queries/image.queries";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useTransition } from "react";
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

const ImageReorderContainer = () => {
  const { data: hike } = useHikeById();
  const mainImageId = hike?.mainImage?.id;
  const [parent, imagesSorted, setImages] = useDragAndDrop<
    HTMLDivElement,
    ImageType
  >(hike?.images || [], {
    handleEnd: () => onSort(imagesSorted),
    draggable: (el) => {
      return el.id !== "no-drag";
    },
  });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setImages(hike?.images || []);
  }, [hike?.images?.length]);

  const { mutate: deleteImage } = useDeleteImage();
  const { mutate: rotateImage } = useRotateImage();
  const { mutate: updateHike } = useUpdateHike();
  const { mutate: createImage } = useCreateImageByChunks();
  const { mutate: reorderImage } = useReorderImage();
  const onSetMainImage = (imageId: string) => {
    updateHike({
      mainImageId: imageId,
    });
  };

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: [] as unknown as FileList,
    },
  });

  const onSort = (images: ImageType[]) => {
    if (images.every((image, index) => hike?.images[index]?.id === image.id))
      return;
    reorderImage(images.map((image) => image.id));
  };

  const onSubmit = (data: FileList | null) => {
    if (!data || isPending) return;
    startTransition(async () => {
      await Promise.all(
        Array.from(data).map(async (image) => {
          await createImage(image);
        })
      );
    });
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const getRotate = (image: ImageType) => {
    return hike?.images.find((i) => i.id === image.id)?.rotate ?? 0;
  };

  return (
    <div ref={parent} className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {imagesSorted.map((image) => (
        <div key={image.id} className="relative group cursor-pointer">
          <Image
            src={`${config.IMAGE_URL}?path=${image.path}&rotate=${getRotate(image)}`}
            alt={`Photo ${image.id}`}
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
          id="no-drag"
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
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Upload size={24} className="text-primary" />
                <p className="text-primary">Ajouter une photo</p>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ImageReorderContainer;
