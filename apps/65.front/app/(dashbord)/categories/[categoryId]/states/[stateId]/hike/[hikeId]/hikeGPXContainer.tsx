"use client";

import { Button } from "@/components/ui/button";
import { getGpxDownloadUrl } from "@/lib/media-url";
import { useGpxFile } from "@/queries/gpx.queries";
import { useHikeById } from "@/queries/hike.queries";
import { AlertTriangle, Download, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

const HikeGPX = dynamic(() => import("./hikeGPX"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton h-80 rounded-xl sm:h-[26rem]"
      role="status"
      aria-label="Chargement de la carte du tracé GPS"
    />
  ),
});

const HikeGPXContainer = () => {
  const { data: hike } = useHikeById();
  const gpxPath = hike?.gpxFiles?.[0]?.path ?? "";
  const { data: gpxFile, isPending, isError, refetch } = useGpxFile(gpxPath);

  if (!hike?.gpxFiles?.length) return null;

  if (isPending) {
    return (
      <section
        className="mt-12 sm:mt-16"
        role="status"
        aria-live="polite"
        aria-label="Chargement du tracé GPX"
      >
        <span className="sr-only">Chargement du tracé GPX…</span>
        <div aria-hidden="true">
          <div className="mb-5 space-y-2">
            <div className="skeleton h-7 w-52 rounded" />
            <div className="skeleton h-4 w-72 max-w-full rounded" />
          </div>
          <div className="skeleton h-80 rounded-xl sm:h-[26rem]" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        className="mt-12 rounded-xl bg-sunrise-soft px-6 py-8 text-accent-foreground sm:mt-16 sm:px-8"
        aria-labelledby="hike-gpx-error-title"
        role="alert"
      >
        <AlertTriangle className="size-7" aria-hidden="true" />
        <h2 id="hike-gpx-error-title" className="mt-4 text-xl font-semibold">
          L’aperçu du tracé est indisponible
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          Le fichier est toujours accessible. Réessayez d’afficher la carte ou
          téléchargez directement le GPX.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()}>
            <RefreshCw aria-hidden="true" />
            Réessayer
          </Button>
          <Button asChild>
            <a
              href={getGpxDownloadUrl(gpxPath)}
              download={`${hike?.title ?? "itineraire"}.gpx`}
            >
              <Download aria-hidden="true" />
              Télécharger le GPX
            </a>
          </Button>
        </div>
      </section>
    );
  }

  return gpxFile ? <HikeGPX gpx={gpxFile} /> : null;
};

export default HikeGPXContainer;
