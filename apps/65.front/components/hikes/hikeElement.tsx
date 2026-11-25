"use client";

import { config } from "@/config/config";
import { DifficultyEnum } from "@/model/difficulty.model";
import { HikeSearch } from "@/model/hike.model";
import { ArrowRight, Clock, MapPin, Mountain } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
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
  const Heading = isAdmin ? "h3" : "h2";
  const href = isAdmin
    ? `/admin/categories/${hike.category.id}/hike/${hike.id}`
    : `/categories/${hike.category.id}/states/${hike.state?.id ?? -1}/hike/${hike.id}`;

  return (
    <Link
      href={href}
      className={`surface-interactive group flex min-w-0 flex-col overflow-hidden outline-none [content-visibility:auto] focus-visible:ring-[3px] ${isAdmin ? "focus-visible:ring-ring/30" : "focus-visible:ring-ring focus-visible:ring-offset-2"}`}
    >
      <div
        className={`relative overflow-hidden bg-secondary ${isAdmin || hike.mainImage?.path ? "aspect-[16/10]" : "h-16 sm:h-24"}`}
      >
        {hike.mainImage?.path ? (
          <Image
            loader={authenticatedImageLoader}
            src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
            alt=""
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
        <Heading className="mt-2 text-lg font-bold leading-snug tracking-[-0.02em] text-foreground [overflow-wrap:anywhere]">
          {hike.title}
        </Heading>
        {hike.state?.name ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {hike.state.name}
          </p>
        ) : null}

        {(isAdmin ||
          !!hike.distance ||
          !!hike.duration ||
          hike.elevation != null) && (
          <div
            className={`flex flex-wrap gap-x-4 gap-y-2 border-t border-border text-sm text-muted-foreground ${isAdmin ? "mt-5 pt-4" : "mt-3 pt-3"}`}
          >
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
            {hike.elevation != null ? (
              <span className="flex items-center gap-1.5 tabular-nums">
                <Mountain className="size-4" aria-hidden="true" />
                {hike.elevation} m
              </span>
            ) : null}
          </div>
        )}

        <span
          className={`mt-auto flex items-center justify-end gap-1.5 ${isAdmin ? "pt-5" : "pt-3"} text-sm font-semibold text-primary-dark`}
        >
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
