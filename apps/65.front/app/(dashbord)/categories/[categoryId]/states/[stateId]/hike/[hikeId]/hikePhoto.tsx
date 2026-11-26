"use client";

import { config } from "@/config/config";
import { useHikeDetail } from "./useHikeDetail";
import { ZoomIn } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import ImageContainer from "./ImageContainer";

// Match the page-container gutters and the gallery's gap-3 columns.
const fullWidth =
  "(min-width: 80rem) 76rem, (min-width: 64rem) calc(100vw - 4rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)";
const halfWidth =
  "(min-width: 80rem) 37.625rem, (min-width: 64rem) calc(50vw - 2.375rem), (min-width: 40rem) calc(50vw - 1.875rem), calc(100vw - 2rem)";
const featuredWidth =
  "(min-width: 80rem) 50.4rem, (min-width: 64rem) calc(66.667vw - 2.92rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)";
const columnWidth =
  "(min-width: 80rem) 24.84rem, (min-width: 64rem) calc(33.333vw - 1.84rem), (min-width: 40rem) calc(50vw - 1.875rem), calc(100vw - 2rem)";

const HikePhoto = () => {
  const hike = useHikeDetail();
  const images = hike?.images ?? [];
  const hasFeatureLayout = images.length >= 3;

  if (images.length === 0) return null;

  return (
    <section
      id="photos"
      tabIndex={-1}
      className="mt-8 scroll-mt-24 border-t pt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:mt-12 sm:pt-8"
      aria-labelledby="hike-photos-title"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2
          id="hike-photos-title"
          className="text-2xl font-semibold tracking-[-0.015em] text-foreground"
        >
          Le parcours en images
        </h2>
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
              className="object-cover"
              fill
              quality={75}
              sizes={
                images.length === 1
                  ? fullWidth
                  : images.length === 2
                    ? halfWidth
                    : index === 0
                      ? featuredWidth
                      : columnWidth
              }
            />
            <span aria-hidden="true" className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-md bg-card text-primary-dark group-hover:bg-secondary group-focus-visible:bg-secondary">
              <ZoomIn className="size-5" />
            </span>
          </ImageContainer>
        ))}
      </div>
    </section>
  );
};

export default HikePhoto;
