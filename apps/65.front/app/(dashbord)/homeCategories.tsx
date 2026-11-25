"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { useCategories } from "@/queries/categories.queries";
import { ArrowRight, Heart, RefreshCw } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import Link from "next/link";

const HomeCategories = () => {
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <section
      id="terrains"
      tabIndex={-1}
      aria-labelledby="terrain-title"
      className="scroll-mt-24 py-6 sm:py-10"
    >
      <div className="page-container">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 sm:mb-5">
          <h2
            id="terrain-title"
            className="text-xl font-bold tracking-[-0.025em] sm:text-3xl"
          >
            Catégories
          </h2>
          <Button variant="ghost" className="min-h-11 text-primary" asChild>
            <Link href="/favorites">
              <Heart aria-hidden="true" />
              Mes favoris
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
        ) : !categories?.length ? (
          <p className="surface p-6 text-center text-muted-foreground">
            Aucune catégorie disponible.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {category.image_path && (
                  <Image
                    loader={authenticatedImageLoader}
                    src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                  />
                )}
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
