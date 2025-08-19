"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Camera } from "lucide-react";
import ImageReorderContainer from "./imageReorderContainer";

const HikePhoto = () => {
  const { data: hike } = useHikeById();

  return (
    <div className="p-6 bg-white mt-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Camera size={24} />
        Photos ({hike?.images.length})
      </h2>
      <ImageReorderContainer />
    </div>
  );
};

export default HikePhoto;
