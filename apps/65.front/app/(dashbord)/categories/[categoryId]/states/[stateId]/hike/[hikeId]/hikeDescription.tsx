"use client";

import { useHikeById } from "@/queries/hike.queries";
import { AlertTriangle, Info } from "lucide-react";

const HikeDescription = () => {
  const { data: hike } = useHikeById();
  const description = hike?.content?.trim();
  const indications = hike?.indication?.trim();

  if (!description && !indications) return null;

  return (
    <div
      className={`mt-10 grid gap-8 sm:mt-12 sm:gap-10 ${
        description && indications
          ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.8fr)] lg:items-start"
          : ""
      }`}
    >
      {description && (
        <section aria-labelledby="hike-description-title">
          <div className="mb-5 flex items-center gap-3">
            <Info aria-hidden="true" className="size-6 text-primary" />
            <h2
              id="hike-description-title"
              className="text-2xl font-semibold tracking-[-0.015em] text-foreground"
            >
              À propos du parcours
            </h2>
          </div>
          <div className="max-w-[72ch] space-y-4">
            {description
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line, index) => (
                <p
                  key={index}
                  className="text-base leading-7 text-foreground/85"
                >
                  {line}
                </p>
              ))}
          </div>
        </section>
      )}

      {indications && (
        <aside
          className="rounded-xl bg-sunrise-soft p-5 text-accent-foreground sm:p-6"
          aria-labelledby="hike-indications-title"
        >
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle aria-hidden="true" className="size-6 text-accent" />
            <h2
              id="hike-indications-title"
              className="text-xl font-semibold tracking-[-0.01em]"
            >
              À savoir avant de partir
            </h2>
          </div>
          <div className="space-y-3">
            {indications
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line, index) => (
                <p key={index} className="text-sm leading-6 sm:text-base">
                  {line}
                </p>
              ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default HikeDescription;
