"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { useCategories } from "@/queries/categories.queries";
import { ArrowRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HomeCategories = () => {
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <section id="terrains" className="py-14 sm:py-18">
      <div className="page-container">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
              Choisissez votre terrain
            </h2>
            <p className="mt-3 max-w-[60ch] text-muted-foreground">
              Parcourez les activités par pratique, puis affinez votre choix par
              massif lorsque plusieurs secteurs sont disponibles.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/favorites">
              Voir mes favoris
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {isPending ? (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
            role="status"
          >
            <span className="sr-only">Chargement des catégories</span>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="surface flex min-h-56 flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-md text-muted-foreground">
              Les catégories ne peuvent pas être chargées pour le moment.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {(categories ?? []).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                <Image
                  src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 text-white sm:p-4">
                  <span>
                    <span className="block text-sm font-bold sm:text-base">
                      {category.name}
                    </span>
                    {category.states?.length ? (
                      <span className="mt-1 block text-xs text-white/75">
                        {category.states.length}{" "}
                        {category.states.length > 1 ? "massifs" : "massif"}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCategories;
