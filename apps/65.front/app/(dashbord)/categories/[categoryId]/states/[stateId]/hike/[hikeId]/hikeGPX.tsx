"use client";

import { Button } from "@/components/ui/button";
import { SimpleGPXParser } from "@/lib/gpx";
import { getGpxDownloadUrl } from "@/lib/media-url";
import { useHikeById } from "@/queries/hike.queries";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Download, Map, Navigation } from "lucide-react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { useMemo } from "react";

const HikeGPX = ({
  gpx,
  compact = false,
}: {
  gpx: string;
  compact?: boolean;
}) => {
  const { data: hike } = useHikeById({
    select: (data) => ({
      gpxFiles: data.data?.gpxFiles,
      title: data.data?.title,
    }),
  });

  const { center, positions } = useMemo(() => {
    try {
      const parser = new SimpleGPXParser();
      const data = parser.parse(gpx);
      const parsedPositions =
        data.tracks[0]?.points.map(
          (point) => [point.lat, point.lon] as [number, number],
        ) ?? [];

      if (parsedPositions.length === 0) {
        return { center: null, positions: parsedPositions };
      }

      const totals = parsedPositions.reduce<[number, number]>(
        (accumulator, current) => [
          accumulator[0] + current[0],
          accumulator[1] + current[1],
        ],
        [0, 0],
      );

      return {
        center: [
          totals[0] / parsedPositions.length,
          totals[1] / parsedPositions.length,
        ] as [number, number],
        positions: parsedPositions,
      };
    } catch {
      return { center: null, positions: [] as [number, number][] };
    }
  }, [gpx]);

  if (typeof window === "undefined") return null;

  const map = center ? (
    <MapContainer
      center={center as LatLngExpression}
      zoom={12}
      scrollWheelZoom={true}
      className="h-80 w-full rounded-xl outline outline-1 -outline-offset-1 outline-border !z-0 sm:h-[26rem]"
      aria-label={`Carte interactive du parcours ${hike?.title ?? ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        pathOptions={{
          fillColor: "var(--primary)",
          color: "var(--primary)",
          weight: 5,
          opacity: 0.9,
        }}
        positions={positions as LatLngExpression[]}
      />
    </MapContainer>
  ) : (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-muted px-6 text-center outline outline-1 -outline-offset-1 outline-border">
      <Map aria-hidden="true" className="mb-3 size-9 text-primary" />
      <p className="font-semibold text-foreground">
        Aperçu du tracé indisponible
      </p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        Le fichier peut toujours être téléchargé et ouvert dans une application
        GPS compatible.
      </p>
    </div>
  );

  if (compact) return map;

  return (
    <section className="mt-12 sm:mt-16" aria-labelledby="hike-gpx-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Navigation aria-hidden="true" className="size-6 text-primary" />
            <h2
              id="hike-gpx-title"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground"
            >
              Tracé du parcours
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Consultez l’itinéraire sur la carte ou téléchargez le fichier pour
            votre application GPS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild aria-label="Télécharger le tracé GPX">
            <a
              href={getGpxDownloadUrl(hike?.gpxFiles?.[0]?.path ?? "")}
              download={`${hike?.title}.gpx`}
            >
              <Download aria-hidden="true" />
              Télécharger le GPX
            </a>
          </Button>
        </div>
      </div>

      {map}
    </section>
  );
};

export default HikeGPX;
