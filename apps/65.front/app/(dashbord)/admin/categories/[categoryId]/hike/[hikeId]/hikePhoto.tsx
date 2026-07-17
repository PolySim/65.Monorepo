"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Camera } from "lucide-react";
import ImageReorderContainer from "./imageReorderContainer";

const HikePhoto = () => {
  const { data: hike } = useHikeById({
    select: (data) => {
      return {
        images: data.data?.images,
      };
    },
  });

  return (
    <section
      id="hike-photos"
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="hike-photos-title"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
          <Camera className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="hike-photos-title"
              className="text-lg font-semibold tracking-[-0.015em]"
            >
              Galerie photos
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {hike?.images?.length ?? 0} photo
              {(hike?.images?.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Faites glisser les images pour définir leur ordre. L’image
            principale sert aussi de couverture à l’activité.
          </p>
        </div>
      </div>
      <ImageReorderContainer />
    </section>
  );
};

export default HikePhoto;
