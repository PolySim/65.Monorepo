"use client";

import { Button } from "@/components/ui/button";
import { SimpleGPXParser } from "@/lib/gpx";
import { getGpxDownloadUrl } from "@/lib/media-url";
import { useHikeDetail } from "./useHikeDetail";
import { latLngBounds, type FitBoundsOptions, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Download, Map, Navigation } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo } from "react";

const trackStyle = { color: "var(--primary)", weight: 5, opacity: 0.9 };
const trackBoundsOptions: FitBoundsOptions = {
  padding: [24, 24],
  maxZoom: 15,
  animate: false,
};

function FitTrack({ bounds }: { bounds: ReturnType<typeof latLngBounds> }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, trackBoundsOptions);
  }, [bounds, map]);

  return null;
}

const HikeGPX = ({
  gpx,
  compact = false,
}: {
  gpx: string;
  compact?: boolean;
}) => {
  const hike = useHikeDetail();

  const track = useMemo(() => {
    try {
      const { tracks } = new SimpleGPXParser().parse(gpx);
      const segments = tracks.flatMap(({ segments }) =>
        segments.map((points) =>
          points.map(({ lat, lon }): LatLngTuple => [lat, lon]),
        ),
      );
      const bounds = latLngBounds(segments.flat());
      if (!bounds.isValid()) return null;
      return {
        bounds,
        lines: segments.filter((segment) => segment.length > 1),
        singlePoints: segments.filter((segment) => segment.length === 1),
      };
    } catch {
      return null;
    }
  }, [gpx]);

  if (typeof window === "undefined") return null;

  const map = track ? (
    <MapContainer
      bounds={track.bounds}
      boundsOptions={trackBoundsOptions}
      scrollWheelZoom={true}
      className="h-80 w-full rounded-xl outline outline-1 -outline-offset-1 outline-border !z-0 sm:h-[26rem]"
      aria-label={`Carte interactive du parcours ${hike?.title ?? ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitTrack bounds={track.bounds} />
      {track.lines.length > 0 && (
        <Polyline pathOptions={trackStyle} positions={track.lines} />
      )}
      {track.singlePoints.map(([point], index) => (
        <CircleMarker
          key={index}
          center={point}
          radius={6}
          pathOptions={trackStyle}
        />
      ))}
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
    <section aria-labelledby="hike-gpx-title">
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
