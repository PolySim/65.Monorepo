"use client";

import { Button } from "@/components/ui/button";
import { getGpxDownloadUrl } from "@/lib/media-url";
import {
  useCreateGpxFile,
  useDeleteGpxFile,
  useGpxFile,
} from "@/queries/gpx.queries";
import { useHikeById } from "@/queries/hike.queries";
import {
  AlertTriangle,
  Download,
  Loader2,
  Navigation,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRef } from "react";

const HikeGPX = dynamic(
  () =>
    import(
      "@/app/(dashbord)/categories/[categoryId]/states/[stateId]/hike/[hikeId]/hikeGPX"
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton h-80 rounded-xl"
        role="status"
        aria-label="Chargement de la carte du tracé GPS"
      />
    ),
  },
);

const HikeGPXContainer = () => {
  const { data: hike } = useHikeById({
    select: (data) => ({
      gpxFiles: data.data?.gpxFiles,
      title: data.data?.title,
    }),
  });
  const gpxPath = hike?.gpxFiles?.[0]?.path ?? "";
  const { data: gpxFile, isPending, isError, refetch } = useGpxFile(gpxPath);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: createGpxFile, isPending: isCreatingGpxFile } =
    useCreateGpxFile();
  const { mutate: deleteGpxFile, isPending: isDeletingGpxFile } =
    useDeleteGpxFile();

  const onSubmit = (file?: File) => {
    if (!file || isCreatingGpxFile) return;
    const formData = new FormData();
    formData.append("gpx", file);
    createGpxFile(formData, {
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  };

  const fileInput = (
    <input
      id="hike-gpx-upload"
      type="file"
      accept=".gpx,application/gpx+xml"
      className="hidden"
      ref={inputRef}
      tabIndex={-1}
      onChange={(event) => onSubmit(event.target.files?.[0])}
    />
  );

  if (gpxPath && isPending) {
    return (
      <section
        id="hike-gpx"
        className="surface scroll-mt-24 p-5 sm:p-6"
        aria-labelledby="hike-gpx-title"
        aria-busy="true"
      >
        <SectionHeading />
        <div
          className="skeleton mt-5 h-72 rounded-xl sm:h-80"
          aria-label="Chargement du tracé GPS"
        />
      </section>
    );
  }

  if (gpxPath && isError) {
    return (
      <section
        id="hike-gpx"
        className="surface scroll-mt-24 p-5 sm:p-6"
        aria-labelledby="hike-gpx-title"
      >
        <SectionHeading hasTrack />
        <div
          className="mt-5 rounded-xl bg-sunrise-soft p-5 text-accent-foreground"
          role="alert"
        >
          <AlertTriangle className="size-6" aria-hidden="true" />
          <h3 className="mt-3 font-semibold">
            Aperçu de la carte indisponible
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6">
            Le tracé importé est conservé. Vous pouvez relancer son affichage ou
            télécharger le fichier pour le contrôler dans votre application GPS.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
                Télécharger
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (gpxFile) {
    return (
      <section
        id="hike-gpx"
        className="surface scroll-mt-24 p-5 sm:p-6"
        aria-labelledby="hike-gpx-title"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading hasTrack />
          <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
            {fileInput}
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isCreatingGpxFile}
            >
              {isCreatingGpxFile ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Remplacer
            </Button>
            <Button variant="outline" asChild>
              <a
                href={getGpxDownloadUrl(gpxPath)}
                download={`${hike?.title ?? "itineraire"}.gpx`}
              >
                <Download aria-hidden="true" />
                Télécharger
              </a>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteGpxFile()}
              disabled={isDeletingGpxFile}
            >
              {isDeletingGpxFile ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              Supprimer
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl [&>div]:!min-h-80 [&>div]:!rounded-xl [&_.leaflet-container]:!h-80 [&_.leaflet-container]:!rounded-xl">
          <HikeGPX gpx={gpxFile} compact />
        </div>
      </section>
    );
  }

  return (
    <section
      id="hike-gpx"
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="hike-gpx-title"
    >
      <SectionHeading />
      {fileInput}
      <button
        type="button"
        className="mt-5 flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/55 bg-secondary/35 px-6 py-10 text-center text-primary outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary hover:bg-secondary/60 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={isCreatingGpxFile}
        aria-describedby={isCreatingGpxFile ? undefined : "gpx-upload-help"}
      >
        {isCreatingGpxFile ? (
          <>
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
            <span className="font-semibold">Import du tracé…</span>
          </>
        ) : (
          <>
            <Upload className="size-7" aria-hidden="true" />
            <span className="font-semibold">Importer un fichier GPX</span>
            <span
              id="gpx-upload-help"
              className="max-w-md text-sm leading-6 text-muted-foreground"
            >
              Sélectionnez le tracé exporté depuis votre application GPS. Il
              sera affiché sur la carte publique.
            </span>
          </>
        )}
      </button>
    </section>
  );
};

const SectionHeading = ({ hasTrack = false }: { hasTrack?: boolean }) => (
  <div className="flex items-start gap-3">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-alpine-soft text-alpine">
      <Navigation className="size-5" aria-hidden="true" />
    </div>
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="hike-gpx-title"
          className="text-lg font-semibold tracking-[-0.015em]"
        >
          Tracé GPS
        </h2>
        {hasTrack && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            GPX importé
          </span>
        )}
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        {hasTrack
          ? "Contrôlez le parcours sur la carte avant de publier vos changements."
          : "Ajoutez un tracé pour afficher le parcours sur une carte interactive."}
      </p>
    </div>
  </div>
);

export default HikeGPXContainer;
