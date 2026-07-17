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
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <ArrowLeft aria-hidden="true" />
            Retour
          </Button>
          <UpdateInformationContainer>
            <Button type="button" variant="outline">
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

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            className="flex items-center gap-1 rounded-lg bg-muted p-1"
            role="group"
            aria-label="Ajuster le cadrage vertical de l’image principale"
          >
            <span className="hidden px-2 text-xs font-medium text-muted-foreground lg:inline">
              Cadrage de l’image
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Remonter l’image principale"
              title="Remonter l’image principale"
              onClick={() => onUpdateMainImagePosition("up")}
              disabled={isUpdatingPosition || !hike?.mainImage}
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
              disabled={isUpdatingPosition || !hike?.mainImage}
            >
              <ArrowDown aria-hidden="true" />
            </Button>
          </div>
          <HikeDelete />
        </div>
      </div>

      <div className="relative h-64 overflow-hidden bg-muted sm:h-80">
        {hike?.mainImage?.path ? (
          <Image
            loader={authenticatedImageLoader}
            src={`${config.IMAGE_URL}?path=${hike.mainImage.path}&rotate=${hike.mainImage.rotate ?? 0}`}
            alt={`Image principale de ${hike?.title ?? "l’activité"}`}
            className="size-full object-cover transition-[object-position] duration-200 ease-out"
            width={2560}
            height={1440}
            priority
            style={{ objectPosition: `50% ${hike?.mainImagePosition ?? 50}%` }}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-primary-dark text-primary-foreground/80">
            <ImageOff className="size-9" aria-hidden="true" />
            <p className="text-sm font-medium">Aucune image principale</p>
          </div>
        )}

        {hike?.mainImage?.path && (
          <div
            className="absolute inset-0 bg-foreground/45"
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 flex items-end p-5 sm:p-7">
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
