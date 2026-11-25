"use client";

import { getDifficultyColor } from "@/components/hikes/hikeElement";
import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { DifficultyEnum } from "@/model/difficulty.model";
import { useHikeById, useUpdateHike } from "@/queries/hike.queries";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit3,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import Link from "next/link";
import HikeDelete from "./hikeDelete";
import UpdateInformationContainer from "./hikeUpdateInformationContainer";

const HikeHeader = () => {
  const { data: hike } = useHikeById({
    select: (data) => {
      return {
        id: data.data?.id,
        title: data.data?.title,
        mainImage: data.data?.mainImage,
        mainImagePosition: data.data?.mainImagePosition,
        difficulty: data.data?.difficulty,
        state: data.data?.state,
        category: data.data?.category,
      };
    },
  });

  const { mutate: updateHike, isPending: isUpdatingPosition } = useUpdateHike();
  const publicHref =
    hike?.id && hike.category?.id && hike.state?.id
      ? `/categories/${hike.category.id}/states/${hike.state.id}/hike/${hike.id}`
      : null;

  const onUpdateMainImagePosition = (direction: "up" | "down") => {
    const currentPosition = hike?.mainImagePosition ?? 50;
    const offset = direction === "up" ? -10 : 10;

    updateHike({
      mainImagePosition: Math.min(100, Math.max(0, currentPosition + offset)),
    });
  };

  return (
    <section
      id="hike-header"
      className="surface scroll-mt-24 overflow-hidden"
      aria-labelledby="hike-title"
    >
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href={`/admin/categories/${hike?.category?.id ?? ""}`}>
              <ArrowLeft aria-hidden="true" />
              Toutes les activités
            </Link>
          </Button>
          <UpdateInformationContainer>
            <Button type="button">
              <Edit3 aria-hidden="true" />
              Modifier les informations
            </Button>
          </UpdateInformationContainer>
          {publicHref ? (
            <Button variant="outline" asChild>
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                Aperçu public
                <span className="sr-only"> (nouvel onglet)</span>
              </a>
            </Button>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                disabled
                aria-describedby="public-preview-help"
              >
                <ExternalLink aria-hidden="true" />
                Aperçu public
              </Button>
              <p
                id="public-preview-help"
                className="mt-1 max-w-48 text-xs leading-4 text-muted-foreground"
              >
                Renseignez un massif pour ouvrir l’aperçu.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-1 rounded-lg bg-muted p-1"
            role="group"
            aria-label="Ajuster le cadrage vertical de l’image principale"
          >
            <span className="px-2 text-xs font-medium text-muted-foreground">
              Cadrage de l’image
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remonter l’image principale"
              title="Remonter l’image principale"
              onClick={() => onUpdateMainImagePosition("up")}
              disabled={
                isUpdatingPosition ||
                !hike?.mainImage ||
                (hike.mainImagePosition ?? 50) <= 0
              }
            >
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Descendre l’image principale"
              title="Descendre l’image principale"
              onClick={() => onUpdateMainImagePosition("down")}
              disabled={
                isUpdatingPosition ||
                !hike?.mainImage ||
                (hike.mainImagePosition ?? 50) >= 100
              }
            >
              <ArrowDown aria-hidden="true" />
            </Button>
          </div>
          <HikeDelete />
        </div>
      </div>

      <div className="relative min-h-56 overflow-hidden bg-muted sm:min-h-64">
        {hike?.mainImage?.path ? (
          <Image
            loader={authenticatedImageLoader}
            src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
            alt={`Image principale de ${hike?.title ?? "l’activité"}`}
            className="absolute inset-0 size-full object-cover transition-[object-position] duration-200 ease-out"
            fill
            sizes="(min-width: 80rem) 59rem, (min-width: 64rem) calc(100vw - 21rem), (min-width: 40rem) calc(100vw - 3rem), calc(100vw - 2rem)"
            quality={75}
            style={{ objectPosition: `50% ${hike?.mainImagePosition ?? 50}%` }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-start gap-2 bg-primary-dark pt-5 text-primary-foreground/80">
            <ImageOff className="size-9" aria-hidden="true" />
            <p className="text-sm font-medium">Aucune image principale</p>
          </div>
        )}

        {hike?.mainImage?.path && (
          <div className="absolute inset-0 bg-black/65" aria-hidden="true" />
        )}
        <div className="relative flex min-h-56 items-end p-5 pt-28 sm:min-h-64 sm:p-7 sm:pt-28">
          <div className="flex w-full flex-col gap-4 text-primary-foreground sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="mb-1.5 text-sm font-medium text-primary-foreground/85">
                {hike?.state?.name || "Massif non renseigné"}
              </p>
              <h1
                id="hike-title"
                className="break-words text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
              >
                {hike?.title || "Activité sans nom"}
              </h1>
            </div>
            {hike?.difficulty && (
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${getDifficultyColor(hike?.difficulty?.id ?? DifficultyEnum.MARCHEUR)}`}
              >
                {hike.difficulty.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HikeHeader;
