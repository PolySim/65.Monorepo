"use client";

import { config } from "@/config/config";
import { useHikeById } from "@/queries/hike.queries";
import { Camera, ZoomIn } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import ImageContainer from "./ImageContainer";

const HikePhoto = () => {
  const { data: hike } = useHikeById();
  const images = hike?.images ?? [];
  const hasFeatureLayout = images.length >= 3;

  if (images.length === 0) return null;

  return (
    <section
      id="photos"
      className="mt-12 scroll-mt-24 sm:mt-16"
      aria-labelledby="hike-photos-title"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Camera aria-hidden="true" className="size-6 text-primary" />
          <h2
            id="hike-photos-title"
            className="text-2xl font-semibold tracking-[-0.015em] text-foreground"
          >
            Le parcours en images
          </h2>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {images.length} photo{images.length > 1 ? "s" : ""}
        </p>
      </div>

      <div
        className={`grid gap-3 ${
          images.length === 1
            ? ""
            : images.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
        }`}
      >
        {images.map((image, index) => (
          <ImageContainer
            key={image.id}
            imageId={image.id}
            imageLabel={`Ouvrir la photo ${index + 1} sur ${images.length} en plein écran`}
            className={
              index === 0 && hasFeatureLayout
                ? "aspect-[4/3] sm:col-span-2 sm:aspect-[16/9] lg:row-span-2 lg:min-h-[28rem] lg:aspect-auto"
                : images.length === 1
                  ? "aspect-[16/9]"
                  : "aspect-[4/3]"
            }
          >
            <Image
              loader={authenticatedImageLoader}
              src={`${config.IMAGE_URL}?path=${image.path}&rotate=${image.rotate ?? 0}`}
              alt={`Photo ${index + 1} de la randonnée ${hike?.title ?? ""}`}
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.025] group-focus-visible:scale-[1.025]"
              fill
              sizes={
                index === 0
                  ? "(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 62vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 46vw, 30vw"
              }
            />
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors duration-200 ease-out group-hover:bg-foreground/45 group-focus-visible:bg-foreground/45">
              <span className="flex min-h-11 items-center gap-2 rounded-lg bg-card px-4 text-sm font-semibold text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn aria-hidden="true" className="size-4" />
                Agrandir
              </span>
            </span>
          </ImageContainer>
        ))}
      </div>
    </section>
  );
};

export default HikePhoto;
