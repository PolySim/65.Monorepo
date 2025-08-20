"use client";

import { config } from "@/config/config";
import { useHikeById } from "@/queries/hike.queries";
import Image from "next/image";

const ImagesCarroussel = () => {
  const { data: hike } = useHikeById();

  return (
    <>
      {hike?.images.map((image) => (
        <div
          key={image.id}
          className="h-screen w-screen bg-transparent snap-center min-w-screen pointer-none:"
        >
          <Image
            className="object-contain h-full w-full"
            src={`${config.IMAGE_URL}?path=${image.path}&rotate=${image.rotate ?? 0}`}
            alt={`image-${image.id}`}
            width={2560}
            height={1440}
          />
        </div>
      ))}
    </>
  );
};

export default ImagesCarroussel;
