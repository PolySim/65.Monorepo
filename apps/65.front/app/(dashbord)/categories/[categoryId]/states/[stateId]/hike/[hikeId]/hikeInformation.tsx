"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPinned, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import HikeDescription from "./hikeDescription";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeGPXContainer from "./hikeGPXContainer";
import HikeHeader, { HikeCollectionLink } from "./hikeHeader";
import HikePageSkeleton from "./hikePageSkeleton";
import HikePhoto from "./hikePhoto";
import { useHikeDetail } from "./useHikeDetail";

export function HikeUnavailable({ missing }: { missing: boolean }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  if (!missing) {
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
          <Button
            className="mt-6"
            variant="outline"
            disabled={retrying}
            onClick={() => startTransition(() => router.refresh())}
          >
            <RefreshCw aria-hidden="true" />
            {retrying ? "Chargement…" : "Réessayer"}
          </Button>
        </div>
      </section>
    );
  }

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
          Cette randonnée n’est plus disponible.
        </p>
      </div>
    </section>
  );
}

const HikeInformation = () => {
  const hike = useHikeDetail();
  if (!hike) return <HikePageSkeleton />;

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
