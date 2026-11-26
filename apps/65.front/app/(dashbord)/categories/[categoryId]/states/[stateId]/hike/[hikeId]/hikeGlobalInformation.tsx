"use client";

import { useHikeDetail } from "./useHikeDetail";

const value = "mt-0.5 text-sm font-semibold text-foreground tabular-nums sm:text-lg";

const HikeGlobalInformation = () => {
  const hike = useHikeDetail();

  if (!hike || (hike.distance == null && !hike.duration && hike.elevation == null))
    return null;

  return (
    <section className="mt-4 border-t pt-3 sm:mt-5" aria-labelledby="hike-key-information">
      <h2 id="hike-key-information" className="sr-only">
        Informations essentielles
      </h2>
      <dl className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground [overflow-wrap:anywhere] sm:gap-x-6 sm:text-sm">
        {hike.distance != null && (
          <div className="min-w-0">
            <dt>Distance</dt>
            <dd className={value}>{hike.distance} km</dd>
          </div>
        )}
        {hike.duration && (
          <div className="min-w-0">
            <dt>Durée estimée</dt>
            <dd className={value}>{hike.duration}</dd>
          </div>
        )}
        {hike.elevation != null && (
          <div className="min-w-0">
            <dt>Dénivelé positif</dt>
            <dd className={value}>{hike.elevation} m</dd>
          </div>
        )}
      </dl>
    </section>
  );
};

export default HikeGlobalInformation;
