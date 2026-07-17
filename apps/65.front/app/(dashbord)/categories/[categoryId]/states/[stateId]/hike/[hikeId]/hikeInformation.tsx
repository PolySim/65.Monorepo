"use client";

import { Button } from "@/components/ui/button";
import { useHikeById } from "@/queries/hike.queries";
import { AlertTriangle, MapPinned, RefreshCw } from "lucide-react";
import HikeDescription from "./hikeDescription";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeGPXContainer from "./hikeGPXContainer";
import HikeHeader from "./hikeHeader";
import HikePhoto from "./hikePhoto";

const HikeInformation = () => {
  const { data: hike, isPending, isError, refetch } = useHikeById();

  if (isPending) {
    return (
      <div
        className="page-container"
        role="status"
        aria-live="polite"
        aria-label="Chargement des informations de la randonnée"
      >
        <span className="sr-only">
          Chargement des informations de la randonnée…
        </span>
        <div aria-hidden="true" className="space-y-4">
          <div className="skeleton h-[28rem] rounded-xl sm:h-[32rem] lg:h-[36rem]" />
          <div className="surface grid gap-px overflow-hidden sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex min-h-24 items-center gap-4 p-5">
                <div className="skeleton size-11 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-5 w-28 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <section className="page-container" aria-labelledby="hike-load-error">
        <div
          className="surface flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center"
          role="alert"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mb-4 size-10 text-accent"
          />
          <h1 id="hike-load-error" className="text-2xl font-semibold">
            Impossible de charger cette activité
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Vérifiez votre connexion puis relancez le chargement.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => refetch()}>
            <RefreshCw aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      </section>
    );
  }

  if (!hike) {
    return (
      <section className="page-container" aria-labelledby="hike-not-found">
        <div className="surface flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <MapPinned aria-hidden="true" className="mb-4 size-10 text-primary" />
          <h1 id="hike-not-found" className="text-2xl font-semibold">
            Randonnée introuvable
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Cette randonnée n’est plus disponible ou n’a pas pu être chargée.
          </p>
        </div>
      </section>
    );
  }

  return (
    <article className="page-container pb-6 sm:pb-10">
      <HikeHeader />
      <HikeGlobalInformation />
      <HikeDescription />
      <HikePhoto />
      <HikeGPXContainer />
    </article>
  );
};

export default HikeInformation;
