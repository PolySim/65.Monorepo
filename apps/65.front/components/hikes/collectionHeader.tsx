"use client";

import { useAppParams } from "@/hook/useAppParams";
import { useCategories } from "@/queries/categories.queries";
import { ChevronRight, Heart, MapPin } from "lucide-react";
import Link from "next/link";

const CollectionHeader = ({
  isFavorites = false,
}: {
  isFavorites?: boolean;
}) => {
  const { categoryId, stateId } = useAppParams();
  const { data: categories, isPending } = useCategories();
  const category = categories?.find((item) => item.id === categoryId);
  const state = category?.states?.find((item) => item.id === stateId);

  if (isFavorites) {
    return (
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Heart className="size-4" aria-hidden="true" />
          Votre sélection
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Mes activités favorites
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Retrouvez ici les sorties que vous souhaitez préparer, comparer ou
          garder sous la main.
        </p>
      </header>
    );
  }

  return (
    <header className="mb-8">
      <nav
        className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Fil d’Ariane"
      >
        <Link
          className="rounded outline-none hover:text-primary-dark hover:underline focus-visible:ring-2"
          href="/"
        >
          Explorer
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        {state && category ? (
          <>
            <Link
              className="rounded outline-none hover:text-primary-dark hover:underline focus-visible:ring-2"
              href={`/categories/${category.id}`}
            >
              {category.name}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </>
        ) : null}
        <span aria-current="page">
          {state?.name ?? category?.name ?? "Activités"}
        </span>
      </nav>
      {isPending ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Chargement du titre</span>
          <div className="skeleton h-10 w-72 rounded-lg" />
          <div className="skeleton h-5 w-full max-w-xl rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <MapPin className="size-4" aria-hidden="true" />
            {state ? "Massif" : "Catégorie"}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            {state?.name ?? category?.name ?? "Activités de montagne"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {state
              ? `Toutes les activités disponibles dans le secteur ${state.name}.`
              : `Parcourez les itinéraires et lieux classés dans ${category?.name ?? "cette sélection"}.`}
          </p>
        </>
      )}
    </header>
  );
};

export default CollectionHeader;
