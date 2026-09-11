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
import { useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [uploadError, setUploadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: createGpxFile, isPending: isCreatingGpxFile } =
    useCreateGpxFile();
  const { mutate: deleteGpxFile, isPending: isDeletingGpxFile } =
    useDeleteGpxFile();

  const onSubmit = (file?: File) => {
    if (!file || isCreatingGpxFile || isDeletingGpxFile) return;
    setUploadError("");
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setUploadError("Sélectionnez un fichier au format .gpx.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("gpx", file);
    createGpxFile(formData, {
      onSuccess: (result) => {
        if (!result.success)
          setUploadError(
            "Import impossible. Vérifiez le fichier GPX et réessayez.",
          );
      },
      onError: () =>
        setUploadError(
          "Import impossible. Vérifiez votre connexion et réessayez.",
        ),
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  };

  const fileInput = (
    <input
      id="hike-gpx-upload"
      aria-label="Fichier GPX à importer"
      type="file"
      accept=".gpx,application/gpx+xml"
      className="hidden"
      ref={inputRef}
      tabIndex={-1}
      onChange={(event) => onSubmit(event.target.files?.[0])}
    />
  );

  const busy = isCreatingGpxFile || isDeletingGpxFile;
  return (
    <section
      id="hike-gpx"
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="hike-gpx-title"
    >
      <div className="flex flex-col gap-4">
        <SectionHeading hasTrack={Boolean(gpxPath)} />
        {fileInput}
        {gpxPath && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {isCreatingGpxFile ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              {isCreatingGpxFile ? "Import…" : "Remplacer"}
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
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              <Trash2 aria-hidden="true" />
              Supprimer
            </Button>
          </div>
        )}
      </div>
      {uploadError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {uploadError}
        </p>
      )}
      {gpxPath && isPending ? (
        <div
          className="skeleton mt-5 h-72 rounded-xl sm:h-80"
          role="status"
          aria-label="Chargement du tracé GPS"
        />
      ) : gpxPath && isError ? (
        <div
          className="mt-5 rounded-xl bg-sunrise-soft p-5 text-accent-foreground"
          role="alert"
        >
          <AlertTriangle className="size-6" aria-hidden="true" />
          <h3 className="mt-3 font-semibold">
            Aperçu de la carte indisponible
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6">
            Le tracé importé est conservé. Réessayez ou téléchargez le fichier
            pour le contrôler. Vous pouvez aussi le remplacer.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      ) : gpxFile ? (
        <div className="mt-5 overflow-hidden rounded-xl [&>div]:!min-h-80 [&>div]:!rounded-xl [&_.leaflet-container]:!h-80 [&_.leaflet-container]:!rounded-xl">
          <HikeGPX gpx={gpxFile} compact />
        </div>
      ) : (
        <button
          type="button"
          className="mt-5 flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/55 bg-secondary/35 px-6 py-8 text-center text-primary outline-none transition-colors duration-200 hover:border-primary hover:bg-secondary/60 focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="size-7 animate-spin" aria-hidden="true" />
              <span className="font-semibold" role="status">
                {isDeletingGpxFile
                  ? "Suppression du tracé…"
                  : "Import du tracé…"}
              </span>
            </>
          ) : (
            <>
              <Upload className="size-7" aria-hidden="true" />
              <span className="font-semibold">Importer un fichier GPX</span>
              <span className="max-w-md text-sm leading-6 text-muted-foreground">
                Sélectionnez le tracé exporté depuis votre application GPS. Il
                sera affiché sur la carte publique.
              </span>
            </>
          )}
        </button>
      )}
      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!isDeletingGpxFile) setConfirmDelete(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          showCloseButton={!isDeletingGpxFile}
        >
          <DialogHeader>
            <DialogTitle>Supprimer le tracé GPS ?</DialogTitle>
            <DialogDescription>
              Le tracé sera retiré de la fiche publique. Téléchargez-le avant de
              le supprimer si vous souhaitez le conserver.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDeletingGpxFile}
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingGpxFile}
              onClick={() =>
                deleteGpxFile(undefined, {
                  onSuccess: (result) => {
                    if (result.success) setConfirmDelete(false);
                  },
                })
              }
            >
              {isDeletingGpxFile ? "Suppression…" : "Supprimer le tracé"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          ? "Contrôlez le parcours sur la carte. Les modifications sont appliquées directement à la fiche publique."
          : "Ajoutez un tracé pour afficher le parcours sur une carte interactive."}
      </p>
    </div>
  </div>
);

export default HikeGPXContainer;
