"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { useCategories } from "@/queries/categories.queries";
import { ArrowRight, FolderTree, RefreshCw } from "lucide-react";
import Image from "next/image";
import authenticatedImageLoader from "@/lib/authenticated-image-loader";
import Link from "next/link";

export default function AdminPage() {
  const { data: categories, isPending, isError, refetch } = useCategories();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Administration
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Sélectionnez une catégorie pour gérer les activités, leurs photos et
          leurs traces GPX.
        </p>
      </header>

      <section
        className="surface overflow-hidden"
        aria-labelledby="categories-title"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id="categories-title" className="font-bold">
              Catégories d’activités
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {categories?.length ?? 0} catégories disponibles
            </p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary-dark">
            <FolderTree className="size-5" aria-hidden="true" />
          </span>
        </div>

        {isPending ? (
          <div className="space-y-px bg-border" role="status">
            <span className="sr-only">Chargement des catégories</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-card p-4 sm:px-6"
              >
                <div className="skeleton size-14 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div
            className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center"
            role="alert"
          >
            <p className="max-w-md text-sm text-muted-foreground">
              Les catégories ne peuvent pas être chargées pour le moment.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(categories ?? []).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="group flex min-h-20 items-center gap-4 px-4 py-3 outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:bg-secondary sm:px-6"
                >
                  <Image
                    loader={authenticatedImageLoader}
                    src={`${config.IMAGE_URL}?rotate=0&path=${category.image_path ?? ""}`}
                    alt=""
                    width={112}
                    height={112}
                    className="size-14 shrink-0 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {category.states?.length
                        ? `${category.states.length} ${category.states.length > 1 ? "massifs" : "massif"}`
                        : "Sans massif associé"}
                    </span>
                  </span>
                  <span className="hidden text-sm font-semibold text-primary-dark sm:block">
                    Gérer
                  </span>
                  <ArrowRight
                    className="size-4 text-primary transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
