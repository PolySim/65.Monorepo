"use client";

import { config } from "@/config/config";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import { DifficultyEnum } from "@/model/difficulty.model";
import { HikeSearch } from "@/model/hike.model";
import { Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const getDifficultyColor = (difficulty: DifficultyEnum) => {
  const colors = {
    [DifficultyEnum.PROMENEUR]: "bg-secondary text-secondary-foreground",
    [DifficultyEnum.MARCHEUR]: "bg-alpine-soft text-primary-dark",
    [DifficultyEnum.RANDONNEUR]: "bg-sunrise-soft text-accent-foreground",
    [DifficultyEnum.EXPERIMENTE]: "bg-red-100 text-red-900",
  };
  return colors[difficulty] || "bg-muted text-muted-foreground";
};

// .page-container padding and gridHikes gutters, minus the card's 2px border.
const coverSizes =
  "(min-width: 1280px) 382px, (min-width: 1024px) calc(50vw - 44px), (min-width: 768px) calc(50vw - 36px), (min-width: 640px) calc(100vw - 50px), calc(100vw - 34px)";

function HikeCover({
  src,
  priority,
}: {
  src: string | null;
  priority: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-secondary text-primary-dark">
      <Mountain className="size-8" aria-hidden="true" />
      {src && !failed && (
        <Image
          loader={authenticatedImageLoader}
          src={src}
          alt=""
          fill
          sizes={coverSizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}

const HikeElement = ({
  hike,
  isAdmin,
  priority = false,
}: {
  hike: HikeSearch;
  isAdmin?: boolean;
  priority?: boolean;
}) => {
  const Heading = isAdmin ? "h3" : "h2";
  const href = isAdmin
    ? `/admin/categories/${hike.category.id}/hike/${hike.id}`
    : `/categories/${hike.category.id}/states/${hike.state?.id ?? -1}/hike/${hike.id}`;
  const location = [hike.category.name, hike.state?.name]
    .filter(Boolean)
    .join(" · ");
  const src = hike.mainImage?.path
    ? `${config.IMAGE_URL}?path=${encodeURIComponent(hike.mainImage.path)}&rotate=${hike.mainImage.rotate ?? 0}`
    : null;

  return (
    <Link
      href={href}
      prefetch={isAdmin ? undefined : false}
      className="group flex min-w-0 flex-col rounded-md border border-border bg-card text-card-foreground outline-none hover:border-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="overflow-hidden rounded-t-[inherit]">
        <HikeCover key={src} src={src} priority={priority} />
      </div>
      <div className="flex flex-1 flex-col px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
        <p className="text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
          {location}
        </p>
        <Heading className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere] group-hover:underline group-focus-visible:underline underline-offset-4">
          {hike.title}
        </Heading>

        {(hike.difficulty?.name ||
          hike.distance != null ||
          hike.duration ||
          hike.elevation != null) && (
          <div className="mt-auto pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground tabular-nums">
              {hike.difficulty?.name && (
                <span className="font-medium text-foreground">
                  {hike.difficulty.name}
                </span>
              )}
              {hike.distance != null && <span>{hike.distance} km</span>}
              {hike.duration && <span>{hike.duration}</span>}
              {hike.elevation != null && (
                <span>
                  <span>{hike.elevation} m</span>
                  <span className="sr-only"> de dénivelé</span>
                </span>
              )}
            </div>
          </div>
        )}
        {isAdmin && (
          <span className="mt-auto pt-3 text-sm font-semibold text-primary-dark">
            Modifier l’activité
          </span>
        )}
      </div>
    </Link>
  );
};

export default HikeElement;
