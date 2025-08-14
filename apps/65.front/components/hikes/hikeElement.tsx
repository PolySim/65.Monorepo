"use client";

import { config } from "@/config/config";
import { DifficultyEnum } from "@/model/difficulty.model";
import { HikeSearch } from "@/model/hike.model";
import { Clock, MapPin, Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HikeElement = ({ hike }: { hike: HikeSearch }) => {
  const getDifficultyColor = (difficulty: DifficultyEnum) => {
    const colors = {
      [DifficultyEnum.PROMENEUR]:
        "bg-green-100 text-green-800 border-green-200",
      [DifficultyEnum.MARCHEUR]:
        "bg-yellow-100 text-yellow-800 border-yellow-200",
      [DifficultyEnum.RANDONNEUR]:
        "bg-orange-100 text-orange-800 border-orange-200",
      [DifficultyEnum.EXPERIMENTE]: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Link
      key={hike.id}
      href={`/categories/${hike.category.id}/states/${hike.state.id}/hike/${hike.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex">
        {/* Image */}
        <div className="w-48 h-40 bg-primary">
          <Image
            src={`${config.IMAGE_URL}?path=${hike.mainImage?.path ?? ""}`}
            alt={hike.title}
            width={384}
            height={256}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {hike.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${hike.difficulty?.id ? getDifficultyColor(hike.difficulty.id) : ""}`}
              >
                {hike.difficulty?.name}
              </span>
            </div>

            {/* Informations essentielles */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {!!hike.distance && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{hike.distance} km</span>
                </div>
              )}
              {!!hike.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{hike.duration}</span>
                </div>
              )}
              {!!hike.elevation && (
                <div className="flex items-center gap-1">
                  <Mountain size={16} />
                  <span>{hike.elevation} m</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500">
              Secteur: {hike.state.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HikeElement;
