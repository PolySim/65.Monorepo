"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config/config";
import { SimpleGPXParser } from "@/lib/gpx";
import { useCreateGpxFile, useDeleteGpxFile } from "@/queries/gpx.queries";
import { useHikeById } from "@/queries/hike.queries";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Download, Navigation, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

const HikeGPX = ({ gpx, isAdmin }: { gpx: string; isAdmin?: boolean }) => {
  const { data: hike } = useHikeById();
  const parser = new SimpleGPXParser();
  const data = parser.parse(gpx);
  const positions = data.tracks[0].points.map((point) => [
    point.lat,
    point.lon,
  ]);
  const center = data.tracks[0].points
    .map((point) => [point.lat, point.lon])
    .reduce(
      (acc, curr: number[]) => [acc[0] + curr[0], acc[1] + curr[1]],
      [0, 0]
    )
    .map((elt) => elt / data.tracks[0].points.length);

  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: createGpxFile, isPending: isCreatingGpxFile } =
    useCreateGpxFile();
  const { mutate: deleteGpxFile } = useDeleteGpxFile();

  const onSubmit = (file?: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("gpx", file);
    createGpxFile(formData);
  };

  if (typeof window === "undefined") return null;

  return (
    <div className="p-6 bg-white mt-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Navigation size={24} />
          Tracé GPX
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="destructive" onClick={() => deleteGpxFile()}>
                <Trash2 size={20} />
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".gpx"
                ref={inputRef}
                onChange={(e) => onSubmit(e.target.files?.[0])}
              />
              <Button onClick={() => inputRef.current?.click()}>
                <Upload size={20} />
                Télécharger un nouveau fichier GPX
              </Button>
            </>
          )}
          <Button asChild>
            <a
              href={`${config.API_URL}/gpx?path=${hike?.gpxFiles[0]?.path}`}
              download={`${hike?.title}.gpx`}
            >
              <Download size={20} />
              Télécharger
            </a>
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
        <MapContainer
          center={center as LatLngExpression}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-96 rounded-lg"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline
            pathOptions={{ fillColor: "red", color: "blue" }}
            positions={positions as LatLngExpression[]}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default HikeGPX;
