"use client";

import { getDifficultyColor } from "@/components/hikes/hikeElement";
import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { DifficultyEnum } from "@/model/difficulty.model";
import { useHikeById, useHikeFavorites } from "@/queries/hike.queries";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import UpdateInformationContainer from "./hikeUpdateInformationContainer";

const HikeHeader = () => {
  const { data: hike } = useHikeById();
  const router = useRouter();
  const { data: hikeFavorites } = useHikeFavorites(true);
  const isFavorite = hikeFavorites?.some((h) => h.id === hike?.id);

  return (
    <div className="relative w-full h-[350px] bg-gray-400">
      {/* Image */}
      <Image
        src={`${config.IMAGE_URL}?path=${hike?.mainImage?.path}`}
        alt={hike?.title ?? ""}
        className="w-full h-[350px] object-cover"
        width={1000}
        height={1000}
        style={{ objectPosition: `50% ${hike?.mainImagePosition}%` }}
      />

      {/* Navigation et actions */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>
            <ArrowLeft size={20} />
            <span>Retour</span>
          </Button>
          <UpdateInformationContainer>
            <Button variant="outline">
              <Edit size={20} />
            </Button>
          </UpdateInformationContainer>
        </div>

        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => {}}>
            <Trash2 size={20} />
            <span>Supprime l&apos;activité</span>
          </Button>
        </div>
      </div>

      {/* Titre */}
      <div className="flex absolute top-0 left-0 size-full">
        <div className="flex justify-between gap-2 mt-auto p-8 w-full">
          <div className="flex justify-between items-end text-white w-full">
            <div className="relative">
              <div className="absolute top-0 left-0 size-full bg-black/50 blur-2xl"></div>
              <h1 className="text-4xl font-bold mb-2 opacity-0">
                {hike?.title}
              </h1>
              <p className="text-xl opacity-0">{hike?.state.name}</p>
              <div className="absolute top-0 left-0 size-full">
                <h1 className="text-4xl font-bold mb-2">{hike?.title}</h1>
                <p className="text-xl">{hike?.state.name}</p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getDifficultyColor(hike?.difficulty.id ?? DifficultyEnum.MARCHEUR)}`}
            >
              {hike?.difficulty.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HikeHeader;
