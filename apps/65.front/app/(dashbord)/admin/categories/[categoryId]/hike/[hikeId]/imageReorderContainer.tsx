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
import {
  GripVertical,
  ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: "Sélectionnez au moins une image",
    })
    .refine(
      (files) =>
        Array.from(files).every((file) => file.type.startsWith("image/")),
      { message: "Tous les fichiers sélectionnés doivent être des images" },
    ),
});

type FormSchema = z.infer<typeof formSchema>;

const ImageReorderContainer = () => {
  const { data: hike } = useHikeById({
    select: (data) => ({
      images: data.data?.images,
      mainImage: data.data?.mainImage,
      title: data.data?.title,
    }),
  });
  const mainImageId = hike?.mainImage?.id;
  const [parent, imagesSorted, setImages] = useDragAndDrop<
    HTMLDivElement,
    ImageType
  >(hike?.images || [], {
    handleEnd: () => onSort(imagesSorted),
    draggable: (element) => element.id !== "no-drag",
  });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(hike?.images || []);
  }, [hike?.images, setImages]);

  const { mutate: deleteImage, isPending: isDeleting } = useDeleteImage();
  const { mutate: rotateImage, isPending: isRotating } = useRotateImage();
  const { mutate: updateHike, isPending: isUpdatingMainImage } =
    useUpdateHike();
  const { mutateAsync: createImage, isPending: isCreatingImage } =
    useCreateImageByChunks();
  const { mutate: reorderImage, isPending: isReordering } = useReorderImage();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: [] as unknown as FileList,
    },
  });

  const onSetMainImage = (imageId: string) => {
    updateHike({ mainImageId: imageId });
  };

  const onSort = (images: ImageType[]) => {
    if (images.every((image, index) => hike?.images?.[index]?.id === image.id))
      return;
    reorderImage(images.map((image) => image.id));
  };

  const onSubmit = ({ image: files }: FormSchema) => {
    if (!files.length || isPending) return;
    startTransition(async () => {
      await Promise.all(Array.from(files).map((image) => createImage(image)));
      form.resetField("image");
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const onFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    form.setValue("image", files, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    void form.handleSubmit(onSubmit)();
  };

  const getRotate = (image: ImageType) =>
    hike?.images?.find((item) => item.id === image.id)?.rotate ?? 0;

  const isUploading = isPending || isCreatingImage;

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {isReordering ? "Enregistrement du nouvel ordre des photos" : ""}
      </p>
      <div
        ref={parent}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {imagesSorted.map((image, index) => {
          const isMainImage = mainImageId === image.id;

          return (
            <figure
              key={image.id}
              className="cursor-grab overflow-hidden rounded-xl border border-border bg-card outline-none transition-[box-shadow] duration-200 ease-out focus-within:ring-[3px] focus-within:ring-ring/25 active:cursor-grabbing"
            >
              <div className="relative overflow-hidden bg-muted">
                <Image
                  src={`${config.IMAGE_URL}?path=${image.path}&rotate=${getRotate(image)}`}
                  alt={`Photo ${index + 1} de ${hike?.title ?? "l’activité"}`}
                  className="aspect-video w-full object-cover"
                  width={576}
                  height={384}
                />

                <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
                  {isMainImage ? (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Image principale
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className="flex size-9 items-center justify-center rounded-lg bg-foreground/80 text-background"
                    title="Faire glisser pour réordonner"
                  >
                    <GripVertical className="size-4" aria-hidden="true" />
                    <span className="sr-only">
                      Faire glisser pour réordonner
                    </span>
                  </span>
                </div>
              </div>

              <figcaption className="flex items-center justify-between gap-2 border-t border-border bg-card p-2">
                <span className="pl-1 text-xs font-medium text-muted-foreground tabular-nums">
                  Photo {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/25"
                    aria-label={
                      isMainImage
                        ? "L’image principale ne peut pas être supprimée"
                        : `Supprimer la photo ${index + 1}`
                    }
                    title={
                      isMainImage
                        ? "Choisissez d’abord une autre image principale"
                        : "Supprimer cette photo"
                    }
                    onClick={() => deleteImage(image.id)}
                    disabled={isMainImage || isDeleting}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-primary-dark hover:bg-secondary hover:text-primary-dark"
                    aria-label={
                      isMainImage
                        ? "Cette photo est déjà l’image principale"
                        : `Définir la photo ${index + 1} comme image principale`
                    }
                    title="Définir comme image principale"
                    onClick={() => onSetMainImage(image.id)}
                    disabled={isMainImage || isUpdatingMainImage}
                  >
                    <ImageIcon aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-primary-dark hover:bg-secondary hover:text-primary-dark"
                    aria-label={`Faire pivoter la photo ${index + 1}`}
                    title="Faire pivoter la photo"
                    onClick={() => rotateImage(image.id)}
                    disabled={isRotating}
                  >
                    <RotateCcw aria-hidden="true" />
                  </Button>
                </div>
              </figcaption>
            </figure>
          );
        })}

        <Form {...form}>
          <form
            id="no-drag"
            onSubmit={form.handleSubmit(onSubmit)}
            className="relative min-h-44 rounded-xl border border-dashed border-primary/55 bg-secondary/35 outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary hover:bg-secondary/60 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/20"
          >
            <FormInput
              id="hike-photo-upload"
              type="file"
              name="image"
              className="hidden"
              multiple
              onFilesChange={onFilesChange}
              ref={inputRef}
              accept="image/*"
              tabIndex={-1}
            />
            <button
              type="button"
              className="flex min-h-44 size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-5 py-8 text-center text-primary outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              aria-describedby={isUploading ? undefined : "photo-upload-help"}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                  <span className="font-semibold">Import en cours…</span>
                </>
              ) : (
                <>
                  <Upload className="size-6" aria-hidden="true" />
                  <span className="font-semibold">Ajouter des photos</span>
                  <span
                    id="photo-upload-help"
                    className="max-w-52 text-xs leading-5 text-muted-foreground"
                  >
                    Sélection multiple acceptée · fichiers image uniquement
                  </span>
                </>
              )}
            </button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ImageReorderContainer;
