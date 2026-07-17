"use client";

import { useHikeById } from "@/queries/hike.queries";
import { Clock3, Mountain, Route } from "lucide-react";

const HikeGlobalInformation = () => {
  const { data: hike } = useHikeById();

  if (!(hike?.distance || hike?.duration || hike?.elevation)) return null;

  return (
    <section
      className="surface mt-4 overflow-hidden"
      aria-labelledby="hike-key-information"
    >
      <h2 id="hike-key-information" className="sr-only">
        Informations essentielles
      </h2>
      <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {!!hike.distance && (
          <div className="flex min-h-24 items-center gap-4 px-5 py-4 sm:px-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
              <Route aria-hidden="true" className="size-5" />
            </span>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Distance
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {hike.distance} km
              </dd>
            </div>
          </div>
        )}

        {!!hike.duration && (
          <div className="flex min-h-24 items-center gap-4 px-5 py-4 sm:px-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Durée estimée
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {hike.duration}
              </dd>
            </div>
          </div>
        )}

        {!!hike.elevation && (
          <div className="flex min-h-24 items-center gap-4 px-5 py-4 sm:px-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
              <Mountain aria-hidden="true" className="size-5" />
            </span>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Dénivelé positif
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {hike.elevation} m
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
};

export default HikeGlobalInformation;
