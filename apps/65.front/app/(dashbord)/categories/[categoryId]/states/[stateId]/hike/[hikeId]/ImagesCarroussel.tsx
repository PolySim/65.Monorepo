"use client";

import { config } from "@/config/config";
import { useHikeById } from "@/queries/hike.queries";
import Image from "next/image";

const ImagesCarroussel = () => {
  const { data: hike } = useHikeById();
  const images = hike?.images ?? [];

  return (
    <>
      {images.map((image, index) => (
        <figure
          key={image.id}
          className="flex h-dvh w-screen min-w-full snap-center items-center justify-center p-3 sm:p-8"
        >
          <div className="relative size-full">
            <Image
              className="select-none object-contain"
              src={`${config.IMAGE_URL}?path=${image.path}&rotate=${image.rotate ?? 0}`}
              alt={`Photo ${index + 1} de la randonnée ${hike?.title ?? ""}`}
              fill
              sizes="100vw"
              draggable={false}
            />
          </div>
          <figcaption className="sr-only">
            Photo {index + 1} sur {images.length}
          </figcaption>
        </figure>
      ))}
    </>
  );
};

export default ImagesCarroussel;
