"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { cn } from "@/lib/utils";
import {
  useHikeById,
  useHikeFavorites,
  useToggleFavorite,
} from "@/queries/hike.queries";
import { ArrowLeft, Heart, Images, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const HikeHeader = () => {
  const { data: hike } = useHikeById();
  const router = useRouter();
  const {
    data: hikeFavorites,
    isPending: areFavoritesPending,
    isError: areFavoritesUnavailable,
  } = useHikeFavorites(true);
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useToggleFavorite();
  const isFavorite = hikeFavorites?.some((h) => h.id === hike?.id);
  const favoriteLabel = isFavorite
    ? "Retirer des favoris"
    : "Ajouter aux favoris";
  const imageCount = hike?.images?.length ?? 0;

  return (
    <header
      className="relative isolate h-[28rem] overflow-hidden rounded-xl bg-primary sm:h-[32rem] lg:h-[36rem]"
      aria-labelledby="hike-title"
    >
      {hike?.mainImage?.path && (
        <Image
          src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
          alt={`Paysage de la randonnée ${hike.title}`}
          className="size-full object-cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1280px"
          style={{ objectPosition: `50% ${hike.mainImagePosition ?? 50}%` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-foreground/15" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-foreground/95 via-foreground/55 to-transparent"
      />

      <nav
        aria-label="Actions de la randonnée"
        className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-5"
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          aria-label="Retour à la liste des randonnées"
          className="bg-card text-foreground shadow-sm hover:bg-muted"
        >
          <ArrowLeft aria-hidden="true" />
          <span>Retour</span>
        </Button>

        <div className="flex flex-wrap justify-end gap-2">
          {imageCount > 0 && (
            <Button
              asChild
              variant="secondary"
              className="bg-card text-foreground shadow-sm hover:bg-muted"
            >
              <a href="#photos" aria-label={`Voir les ${imageCount} photos`}>
                <Images aria-hidden="true" />
                <span className="hidden sm:inline">Voir les photos</span>
                <span aria-hidden="true">({imageCount})</span>
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            aria-label={favoriteLabel}
            aria-pressed={isFavorite}
            disabled={
              areFavoritesPending ||
              areFavoritesUnavailable ||
              isTogglingFavorite
            }
            onClick={() => toggleFavorite()}
            className={cn(
              "bg-card text-foreground shadow-sm hover:bg-muted",
              isFavorite &&
                "bg-sunrise text-accent-foreground hover:bg-sunrise/90",
            )}
          >
            <Heart
              aria-hidden="true"
              fill={isFavorite ? "currentColor" : "none"}
            />
            <span className="hidden sm:inline">{favoriteLabel}</span>
          </Button>
        </div>
      </nav>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-5 p-5 text-primary-foreground sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
        <div className="min-w-0 max-w-3xl">
          {(hike?.state?.name || hike?.category?.name) && (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-primary-foreground/90 sm:text-base">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {hike?.state?.name && <span>{hike.state.name}</span>}
              {hike?.state?.name && hike?.category?.name && (
                <span aria-hidden="true">·</span>
              )}
              {hike?.category?.name && <span>{hike.category.name}</span>}
            </p>
          )}
          <h1
            id="hike-title"
            className="break-words text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-balance sm:text-4xl lg:text-5xl"
          >
            {hike?.title}
          </h1>
        </div>

        {hike?.difficulty?.name && (
          <span className="shrink-0 rounded-full bg-sunrise-soft px-3.5 py-2 text-sm font-semibold text-accent-foreground ring-1 ring-accent/30">
            Niveau {hike.difficulty.name}
          </span>
        )}
      </div>
    </header>
  );
};

export default HikeHeader;
