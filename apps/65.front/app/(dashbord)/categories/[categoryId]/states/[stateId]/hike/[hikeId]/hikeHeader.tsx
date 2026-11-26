"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { useAppParams } from "@/hook/useAppParams";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import {
  useHikeFavoriteStatus,
  useSetFavorite,
} from "@/queries/hike.queries";
import { ArrowLeft, Heart, Images, Map, MapPin, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import HikeGlobalInformation from "./hikeGlobalInformation";
import { useHikeDetail } from "./useHikeDetail";

// Half the page-container after its gutters and the split layout's column gap.
const coverSizes =
  "(min-width: 80rem) 36.5rem, (min-width: 64rem) calc(50vw - 3.5rem), (min-width: 48rem) calc(50vw - 2.5rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)";

const quickAction = "gap-1.5 has-[>svg]:px-2 sm:has-[>svg]:px-3";

export function HikeCollectionLink() {
  const { categoryId, stateId } = useAppParams();
  const category = `/categories/${encodeURIComponent(categoryId)}`;
  const hasState = !!stateId && stateId !== "-1";
  const href = hasState
    ? `${category}/states/${encodeURIComponent(stateId)}`
    : category;

  return (
    <Button asChild variant="link" className="min-h-11 has-[>svg]:px-0">
      <Link href={href}>
        <ArrowLeft aria-hidden="true" />
        {hasState ? "Activités du massif" : "Activités de la catégorie"}
      </Link>
    </Button>
  );
}

const HikeHeader = () => {
  const hike = useHikeDetail();
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
      <nav aria-label="Navigation de la fiche" className="mb-3 sm:mb-5">
        <HikeCollectionLink />
      </nav>
      <div
        className={
          hike.mainImage?.path
            ? "grid items-center gap-5 md:grid-cols-2 md:gap-8 lg:gap-12"
            : "max-w-3xl"
        }
      >
        <div className="min-w-0">
          <h1
            id="hike-title"
            className="text-3xl leading-[1.08] font-bold tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl xl:text-[3.5rem]"
          >
            {hike.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground empty:hidden sm:mt-3">
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
              <span className="font-semibold text-foreground [overflow-wrap:anywhere]">
                Niveau {hike.difficulty.name}
              </span>
            )}
          </div>
          <HikeGlobalInformation />
          <div
            className="mt-4 flex flex-wrap gap-2 sm:mt-5"
            role="group"
            aria-label="Actions de la randonnée"
          >
            {!!hike.gpxFiles?.length && (
              <Button
                asChild
                className={`${quickAction} shadow-none`}
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
                className={quickAction}
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
                className={quickAction}
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
        {hike.mainImage?.path && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-secondary md:aspect-[4/3] lg:aspect-[16/10]">
            <Image
              loader={authenticatedImageLoader}
              src={`${config.IMAGE_URL}?path=${encodeURIComponent(hike.mainImage.path)}&rotate=${hike.mainImage.rotate ?? 0}`}
              alt={`Paysage de la randonnée ${hike.title}`}
              className="object-cover"
              fill
              priority
              sizes={coverSizes}
              style={{ objectPosition: `50% ${hike.mainImagePosition ?? 50}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default HikeHeader;
