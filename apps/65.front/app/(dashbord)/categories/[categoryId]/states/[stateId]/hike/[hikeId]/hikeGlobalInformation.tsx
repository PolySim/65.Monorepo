"use client";

import { useHikeDetail } from "./useHikeDetail";
import { Clock3, Mountain, Route } from "lucide-react";

const fact =
  "flex min-w-0 flex-col gap-1.5 bg-card px-2.5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4";
const icon =
  "flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark sm:size-11";
const label = "text-xs font-medium text-muted-foreground sm:text-sm";
const value =
  "mt-0.5 text-sm font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-lg";

const HikeGlobalInformation = () => {
  const hike = useHikeDetail();

  if (!hike || !(hike.distance || hike.duration || hike.elevation != null))
    return null;

  return (
    <section
      className="surface mt-4 overflow-hidden"
      aria-labelledby="hike-key-information"
    >
      <h2 id="hike-key-information" className="sr-only">
        Informations essentielles
      </h2>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,5.75rem),1fr))] gap-px bg-border sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {!!hike.distance && (
          <div className={fact}>
            <span className={icon}>
              <Route aria-hidden="true" className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <dt className={label}>Distance</dt>
              <dd className={value}>{hike.distance} km</dd>
            </div>
          </div>
        )}

        {!!hike.duration && (
          <div className={fact}>
            <span className={icon}>
              <Clock3 aria-hidden="true" className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <dt className={label}>Durée estimée</dt>
              <dd className={value}>{hike.duration}</dd>
            </div>
          </div>
        )}

        {hike.elevation != null && (
          <div className={fact}>
            <span className={icon}>
              <Mountain aria-hidden="true" className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <dt className={label}>Dénivelé positif</dt>
              <dd className={value}>{hike.elevation} m</dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
};

export default HikeGlobalInformation;
