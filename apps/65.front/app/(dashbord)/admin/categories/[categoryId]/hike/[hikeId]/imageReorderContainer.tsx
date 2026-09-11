"use client";

import { Button } from "@/components/ui/button";
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
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ImageType | null>(null);
  const uploadLock = useRef(false);
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

  const onSetMainImage = (imageId: string) => {
    updateHike({ mainImageId: imageId });
  };

  const onSort = (images: ImageType[]) => {
    if (isReordering || isDeleting || isUploading) return;
    if (images.every((image, index) => hike?.images?.[index]?.id === image.id))
      return;
    reorderImage(images.map((image) => image.id));
  };

  const moveImage = (index: number, offset: number) => {
    const next = [...imagesSorted];
    const target = index + offset;
    if (target < 0 || target >= next.length || isReordering) return;
    [next[index], next[target]] = [next[target], next[index]];
    onSort(next);
  };

  const onFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || uploadLock.current) return;
    setUploadError("");
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setUploadError("Sélectionnez uniquement des fichiers image.");
      event.target.value = "";
      return;
    }
    uploadLock.current = true;
    const failures: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress({ current: index + 1, total: files.length });
        try {
          const result = await createImage(file);
          if (!result.success) failures.push(file.name);
        } catch {
          failures.push(file.name);
        }
      }
      if (failures.length)
        setUploadError(
          `Import impossible : ${failures.join(", ")}. Sélectionnez à nouveau ces fichiers pour réessayer.`,
        );
    } finally {
      uploadLock.current = false;
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const getRotate = (image: ImageType) =>
    hike?.images?.find((item) => item.id === image.id)?.rotate ?? 0;

  const isUploading = uploadProgress !== null || isCreatingImage;
  const isBusy =
    isUploading ||
    isDeleting ||
    isRotating ||
    isUpdatingMainImage ||
    isReordering;

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {isReordering ? "Enregistrement du nouvel ordre des photos" : ""}
      </p>
      <div
        ref={parent}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3"
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
                  loader={authenticatedImageLoader}
                  src={`${config.IMAGE_URL}?path=${image.path}&rotate=${getRotate(image)}`}
                  alt={`Photo ${index + 1} de ${hike?.title ?? "l’activité"}`}
                  className="aspect-video h-auto w-full object-cover"
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

              <figcaption className="border-t border-border bg-card p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="pl-1 text-xs font-medium text-muted-foreground">
                    Ordre de la galerie
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Avancer la photo ${index + 1}`}
                      title="Avancer dans la galerie"
                      disabled={index === 0 || isBusy}
                      onClick={() => moveImage(index, -1)}
                    >
                      <ArrowLeft aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Reculer la photo ${index + 1}`}
                      title="Reculer dans la galerie"
                      disabled={index === imagesSorted.length - 1 || isBusy}
                      onClick={() => moveImage(index, 1)}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
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
                      onClick={() => setDeleteTarget(image)}
                      disabled={isMainImage || isBusy}
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
                      disabled={isMainImage || isBusy}
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
                      disabled={isBusy}
                    >
                      <RotateCcw aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </figcaption>
            </figure>
          );
        })}

        <div
          id="no-drag"
          className="relative min-h-44 rounded-xl border border-dashed border-primary/55 bg-secondary/35 outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary hover:bg-secondary/60 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/20"
        >
          <input
            id="hike-photo-upload"
            type="file"
            className="hidden"
            aria-label="Photos à importer"
            multiple
            onChange={(event) => void onFilesChange(event)}
            ref={inputRef}
            accept="image/*"
            tabIndex={-1}
            disabled={isBusy}
          />
          <button
            type="button"
            className="flex min-h-44 size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-5 py-8 text-center text-primary outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            aria-describedby={isUploading ? undefined : "photo-upload-help"}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                <span className="font-semibold" role="status">
                  Import de la photo {uploadProgress?.current ?? 1} sur{" "}
                  {uploadProgress?.total ?? 1}…
                </span>
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
        </div>
      </div>
      {uploadError && (
        <p role="alert" className="mt-4 break-words text-sm text-destructive">
          {uploadError}
        </p>
      )}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md" showCloseButton={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Supprimer cette photo ?</DialogTitle>
            <DialogDescription>
              Elle sera retirée définitivement de la galerie de l’activité.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (deleteTarget)
                  deleteImage(deleteTarget.id, {
                    onSuccess: (result) => {
                      if (result.success) setDeleteTarget(null);
                    },
                  });
              }}
            >
              {isDeleting ? "Suppression…" : "Supprimer la photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageReorderContainer;
