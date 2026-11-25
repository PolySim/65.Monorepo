"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { useAppParams } from "@/hook/useAppParams";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import {
  useHikeById,
  useHikeFavoriteStatus,
  useSetFavorite,
} from "@/queries/hike.queries";
import { ArrowLeft, Heart, Images, Map, MapPin, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HikeCollectionLink() {
  const { categoryId, stateId } = useAppParams();
  const category = `/categories/${encodeURIComponent(categoryId)}`;
  const hasState = !!stateId && stateId !== "-1";
  const href = hasState
    ? `${category}/states/${encodeURIComponent(stateId)}`
    : category;

  return (
    <Button asChild variant="ghost" className="min-h-11 px-2.5 text-primary">
      <Link href={href}>
        <ArrowLeft aria-hidden="true" />
        {hasState ? "Activités du massif" : "Activités de la catégorie"}
      </Link>
    </Button>
  );
}

const HikeHeader = () => {
  const { data: hike } = useHikeById();
  const favoriteStatus = useHikeFavoriteStatus(!!hike?.id);
  const { mutate: setFavorite, isPending: isSettingFavorite } =
    useSetFavorite();
  if (!hike) return null;

  const isFavorite = favoriteStatus.data?.isFavorite;
  const favoriteLabel = isFavorite
    ? "Retirer des favoris"
    : "Ajouter aux favoris";
  const imageCount = hike.images?.length ?? 0;

  return (
    <header aria-labelledby="hike-title">
      <nav aria-label="Navigation de la fiche" className="mb-2">
        <HikeCollectionLink />
      </nav>
      <div className="surface overflow-hidden">
        {hike.mainImage?.path && (
          <div className="relative h-36 bg-secondary sm:h-60 lg:h-[23rem]">
            <Image
              loader={authenticatedImageLoader}
              src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
              alt={`Paysage de la randonnée ${hike.title}`}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 80rem) 76rem, (min-width: 64rem) calc(100vw - 4rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)"
              style={{ objectPosition: `50% ${hike.mainImagePosition ?? 50}%` }}
            />
          </div>
        )}
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <h1
            id="hike-title"
            className="text-2xl font-bold leading-tight tracking-[-0.025em] [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl"
          >
            {hike.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {(hike.state?.name || hike.category?.name) && (
              <p className="flex min-w-0 items-center gap-1.5 [overflow-wrap:anywhere]">
                <MapPin
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                <span>
                  {[hike.state?.name, hike.category?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </p>
            )}
            {hike.difficulty?.name && (
              <span className="rounded-full bg-sunrise-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                Niveau {hike.difficulty.name}
              </span>
            )}
          </div>
          <div
            className="mt-3 flex flex-wrap gap-1.5 border-t pt-3 sm:gap-2"
            role="group"
            aria-label="Actions de la randonnée"
          >
            {!!hike.gpxFiles?.length && (
              <Button
                asChild
                variant="outline"
                className="min-h-11 gap-1.5 px-2.5 sm:px-3"
              >
                <a href="#carte">
                  <Map aria-hidden="true" /> Carte
                </a>
              </Button>
            )}
            {imageCount > 0 && (
              <Button
                asChild
                variant="outline"
                className="min-h-11 gap-1.5 px-2.5 sm:px-3"
              >
                <a
                  href="#photos"
                  aria-label={`Voir les photos (${imageCount})`}
                >
                  <Images aria-hidden="true" /> Photos
                </a>
              </Button>
            )}
            {favoriteStatus.isError ? (
              <Button
                variant="outline"
                className="min-h-11 px-3"
                disabled={favoriteStatus.isFetching}
                onClick={() => favoriteStatus.refetch()}
                aria-label="Réessayer le chargement du favori"
              >
                <RefreshCw aria-hidden="true" /> Favori indisponible
              </Button>
            ) : (
              <Button
                type="button"
                variant={isFavorite ? "secondary" : "outline"}
                aria-label={favoriteLabel}
                aria-pressed={isFavorite}
                disabled={
                  isFavorite === undefined ||
                  favoriteStatus.isFetching ||
                  isSettingFavorite
                }
                onClick={() => {
                  if (isFavorite !== undefined)
                    setFavorite({ hikeId: hike.id, isFavorite: !isFavorite });
                }}
                className="min-h-11 gap-1.5 px-2.5 sm:px-3"
              >
                <Heart
                  aria-hidden="true"
                  fill={isFavorite ? "currentColor" : "none"}
                />
                {isFavorite === undefined || isSettingFavorite
                  ? "Favori…"
                  : isFavorite
                    ? "En favori"
                    : "Favori"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HikeHeader;
