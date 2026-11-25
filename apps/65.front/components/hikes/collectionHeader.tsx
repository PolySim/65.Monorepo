"use client";

import { useAppParams } from "@/hook/useAppParams";
import { useCategories } from "@/queries/categories.queries";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const breadcrumbLink =
  "inline-flex min-h-11 items-center rounded underline-offset-4 outline-none hover:text-primary-dark hover:underline focus-visible:ring-2 focus-visible:ring-ring";

const CollectionHeader = ({
  isFavorites = false,
}: {
  isFavorites?: boolean;
}) => {
  const { categoryId, stateId } = useAppParams();
  const { data: categories, isPending } = useCategories();
  const category = categories?.find((item) => item.id === categoryId);
  const state = category?.states?.find((item) => item.id === stateId);
  const title = isFavorites
    ? "Mes favoris"
    : (state?.name ?? category?.name ?? "Activités");

  return (
    <header className="mb-4 sm:mb-6">
      <nav
        className="mb-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
        aria-label="Fil d’Ariane"
      >
        <Link className={breadcrumbLink} href="/#terrains">
          Catégories
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        {stateId && category && (
          <>
            <Link
              className={breadcrumbLink}
              href={`/categories/${category.id}`}
            >
              {category.name}
            </Link>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          </>
        )}
        <span aria-current="page" className="[overflow-wrap:anywhere]">
          {title}
        </span>
      </nav>
      {!isFavorites && isPending ? (
        <div
          role="status"
          aria-label="Chargement du titre"
          className="skeleton h-9 w-64 max-w-full rounded-lg sm:h-10"
        />
      ) : (
        <h1 className="text-3xl font-bold tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-4xl">
          {title}
        </h1>
      )}
      {!isFavorites && !stateId && !!category?.states?.length && (
        <nav
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Filtrer par massif"
        >
          {category.states.map((item) => (
            <Link
              key={item.id}
              href={`/categories/${category.id}/states/${item.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-secondary px-3 text-sm font-semibold text-secondary-foreground outline-none hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default CollectionHeader;
