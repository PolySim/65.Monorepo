"use client";

import { Button } from "@/components/ui/button";
import { useHikeById } from "@/queries/hike.queries";
import { AlertTriangle, MapPinned, RefreshCw } from "lucide-react";
import HikeDescription from "./hikeDescription";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeGPXContainer from "./hikeGPXContainer";
import HikeHeader, { HikeCollectionLink } from "./hikeHeader";
import HikePageSkeleton from "./hikePageSkeleton";
import HikePhoto from "./hikePhoto";

const HikeInformation = () => {
  const { data: hike, isPending, isError, refetch } = useHikeById();

  if (isPending) {
    return <HikePageSkeleton />;
  }

  if (isError) {
    return (
      <section className="page-container" aria-labelledby="hike-load-error">
        <div className="mb-2">
          <HikeCollectionLink />
        </div>
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
        <div className="mb-2">
          <HikeCollectionLink />
        </div>
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
      {!!hike.gpxFiles?.length && (
        <div
          id="carte"
          tabIndex={-1}
          className="mt-8 flow-root scroll-mt-24 sm:mt-12"
        >
          <HikeGPXContainer />
        </div>
      )}
    </article>
  );
};

export default HikeInformation;
