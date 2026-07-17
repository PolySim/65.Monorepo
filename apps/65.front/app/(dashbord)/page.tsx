import { Suspense } from "react";
import Caroussel from "./caroussel";
import HomeCategories from "./homeCategories";
import SearchHikes from "./searchHikes";

export default function Home() {
  return (
    <div className="flex-1">
      <section className="bg-primary-dark text-primary-foreground">
        <div className="page-container grid min-h-[34rem] items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)] lg:py-16">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-primary-foreground/75">
              Hautes-Pyrénées · Département 65
            </p>
            <h1 className="max-w-[12ch] text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Votre prochaine sortie commence ici.
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-7 text-primary-foreground/80 sm:text-lg">
              Randonnées, refuges, escalade ou ski : trouvez l’activité qui
              correspond à votre terrain, votre niveau et votre envie du jour.
            </p>
            <div className="mt-8 max-w-2xl">
              <Suspense fallback={<div className="skeleton h-24 rounded-xl" />}>
                <SearchHikes />
              </Suspense>
            </div>
            <a
              href="#terrains"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-semibold text-primary-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-white/30"
            >
              Parcourir toutes les catégories
            </a>
          </div>
          <Caroussel />
        </div>
      </section>

      <HomeCategories />
    </div>
  );
}
