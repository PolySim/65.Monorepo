"use client";

import HikeGPX from "@/app/(dashbord)/categories/[categoryId]/states/[stateId]/hike/[hikeId]/hikeGPX";
import { useCreateGpxFile, useGpxFile } from "@/queries/gpx.queries";
import { useHikeById } from "@/queries/hike.queries";
import { Loader2, Navigation } from "lucide-react";
import { useRef } from "react";

const HikeGPXContainer = () => {
  const { data: hike } = useHikeById();
  const { data: gpxFile, isPending } = useGpxFile(
    hike?.gpxFiles[0]?.path ?? ""
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: createGpxFile, isPending: isCreatingGpxFile } =
    useCreateGpxFile();

  const onSubmit = (file?: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("gpx", file);
    createGpxFile(formData);
  };

  return hike?.gpxFiles[0]?.path && isPending ? (
    <div className="p-6 bg-white mt-2 flex items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-primary" />
    </div>
  ) : gpxFile ? (
    <HikeGPX gpx={gpxFile} isAdmin />
  ) : (
    <div className="p-6 bg-white mb-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Navigation size={24} />
        Tracé GPS
      </h2>
      <input
        type="file"
        accept=".gpx"
        className="hidden"
        ref={inputRef}
        onChange={(e) => onSubmit(e.target.files?.[0])}
      />
      {isCreatingGpxFile ? (
        <div className="p-6 bg-white mt-2 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="bg-gray-100 rounded-lg h-64 flex items-center justify-center"
        >
          <div className="text-center">
            <Navigation size={48} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Carte interactive du parcours</p>
            <p className="text-sm text-gray-500">
              Cliquez pour ajouter un tracé GPS
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HikeGPXContainer;
