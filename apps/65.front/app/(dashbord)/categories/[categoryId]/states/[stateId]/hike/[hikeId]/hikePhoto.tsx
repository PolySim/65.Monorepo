"use client";

import { config } from "@/config/config";
import { Hike } from "@/model/hike.model";
import { Camera, ZoomIn } from "lucide-react";
import Image from "next/image";
import ImageContainer from "./ImageContainer";

const HikePhoto = ({ hike }: { hike: Hike }) => {
  return (
    <div className="p-6 bg-white mt-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Camera size={24} />
        Photos ({hike.images.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {hike.images
          .sort((a, b) => a.ordered - b.ordered)
          .map((image, index) => (
            <div key={index} className="relative group cursor-pointer">
              <ImageContainer imageId={image.id}>
                <Image
                  src={`${config.IMAGE_URL}?path=${image.path}&rotate=${image.rotate ?? 0}`}
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
              </ImageContainer>
            </div>
          ))}
      </div>
    </div>
  );
};

export default HikePhoto;
