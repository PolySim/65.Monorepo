"use client";

import { config } from "@/config/config";
import { DifficultyEnum } from "@/model/difficulty.model";
import { HikeSearch } from "@/model/hike.model";
import { ArrowRight, Clock, MapPin, Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const getDifficultyColor = (difficulty: DifficultyEnum) => {
  const colors = {
    [DifficultyEnum.PROMENEUR]: "bg-secondary text-secondary-foreground",
    [DifficultyEnum.MARCHEUR]: "bg-alpine-soft text-primary-dark",
    [DifficultyEnum.RANDONNEUR]: "bg-sunrise-soft text-accent-foreground",
    [DifficultyEnum.EXPERIMENTE]: "bg-red-100 text-red-900",
  };
  return colors[difficulty] || "bg-muted text-muted-foreground";
};

const HikeElement = ({
  hike,
  isAdmin,
}: {
  hike: HikeSearch;
  isAdmin?: boolean;
}) => {
  const href = isAdmin
    ? `/admin/categories/${hike.category.id}/hike/${hike.id}`
    : `/categories/${hike.category.id}/states/${hike.state?.id ?? -1}/hike/${hike.id}`;

  return (
    <Link
      href={href}
      className="surface-interactive group flex min-w-0 flex-col overflow-hidden outline-none [content-visibility:auto] focus-visible:ring-[3px] focus-visible:ring-ring/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {hike.mainImage?.path ? (
          <Image
            src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
            alt={hike.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out group-hover:scale-[1.025] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <Mountain className="size-10" aria-hidden="true" />
          </div>
        )}
        {hike.difficulty?.name ? (
          <span
            className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyColor(hike.difficulty.id)}`}
          >
            {hike.difficulty.name}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold text-primary">
          {hike.category.name}
        </p>
        <h3 className="mt-2 text-lg font-bold leading-snug tracking-[-0.02em] text-foreground">
          {hike.title}
        </h3>
        {hike.state?.name ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {hike.state.name}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
          {hike.distance ? (
            <span className="flex items-center gap-1.5 tabular-nums">
              <MapPin className="size-4" aria-hidden="true" />
              {hike.distance} km
            </span>
          ) : null}
          {hike.duration ? (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock className="size-4" aria-hidden="true" />
              {hike.duration}
            </span>
          ) : null}
          {hike.elevation ? (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Mountain className="size-4" aria-hidden="true" />
              {hike.elevation} m
            </span>
          ) : null}
        </div>

        <span className="mt-auto flex items-center justify-end gap-1.5 pt-5 text-sm font-semibold text-primary-dark">
          {isAdmin ? "Modifier l’activité" : "Voir l’itinéraire"}
          <ArrowRight
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
};

export default HikeElement;
