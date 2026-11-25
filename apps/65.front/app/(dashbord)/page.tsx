import { ArrowDown } from "lucide-react";
import { Suspense } from "react";
import Caroussel from "./caroussel";
import HomeCategories from "./homeCategories";
import SearchHikes from "./searchHikes";

export default function Home() {
  return (
    <div className="flex-1">
      <section className="bg-primary-dark text-primary-foreground">
        <div className="page-container grid items-center gap-10 py-7 sm:py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)] lg:py-12">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Explorez les Hautes-Pyrénées
            </h1>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/85 sm:mt-4 sm:text-base">
              Randonnées, refuges, escalade et ski.
            </p>
            <div className="mt-5 max-w-2xl sm:mt-7">
              <Suspense
                fallback={<div className="skeleton h-[5.25rem] rounded-xl" />}
              >
                <SearchHikes />
              </Suspense>
            </div>
            <a
              href="#terrains"
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-white/60 sm:mt-4"
            >
              <ArrowDown aria-hidden="true" className="size-4" />
              Voir les catégories
            </a>
          </div>
          <Caroussel />
        </div>
      </section>

      <HomeCategories />
    </div>
  );
}
