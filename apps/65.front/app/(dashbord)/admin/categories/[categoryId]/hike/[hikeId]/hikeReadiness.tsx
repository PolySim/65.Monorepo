import { Hike } from "@/model/hike.model";
import { ArrowDownRight, CheckCircle2, Circle } from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  href: string;
  complete: boolean;
};

export default function HikeReadiness({ hike }: { hike: Hike }) {
  const essentialStatsComplete =
    typeof hike.distance === "number" &&
    Number.isFinite(hike.distance) &&
    hike.distance > 0 &&
    Boolean(hike.duration?.trim()) &&
    typeof hike.elevation === "number" &&
    Number.isFinite(hike.elevation) &&
    hike.elevation >= 0;

  const checklist: ChecklistItem[] = [
    {
      id: "classification",
      label: "Titre et classification",
      href: "#hike-header",
      complete: Boolean(
        hike.title?.trim() &&
          hike.category?.id &&
          hike.state?.id &&
          hike.difficulty?.id,
      ),
    },
    {
      id: "essentials",
      label: "Données essentielles",
      href: "#essential-information",
      complete: essentialStatsComplete,
    },
    {
      id: "description",
      label: "Description",
      href: "#hike-content",
      complete: Boolean(hike.content?.trim()),
    },
    {
      id: "indications",
      label: "Indications",
      href: "#hike-content",
      complete: Boolean(hike.indication?.trim()),
    },
    {
      id: "main-image",
      label: "Image principale",
      href: "#hike-photos",
      complete: Boolean(hike.mainImage?.path),
    },
    {
      id: "photos",
      label: "Galerie photos",
      href: "#hike-photos",
      complete: (hike.images?.length ?? 0) > 0,
    },
    {
      id: "gpx",
      label: "Tracé GPX",
      href: "#hike-gpx",
      complete: (hike.gpxFiles?.length ?? 0) > 0,
    },
  ];

  const completedCount = checklist.filter((item) => item.complete).length;
  const progress = Math.round((completedCount / checklist.length) * 100);
  const isReady = completedCount === checklist.length;

  return (
    <section
      className="surface p-4 sm:p-5"
      aria-labelledby="hike-readiness-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="hike-readiness-title" className="font-semibold">
              Préparation de la fiche
            </h2>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {completedCount}/{checklist.length} éléments prêts
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isReady
              ? "Toutes les informations de publication sont renseignées."
              : "Complétez les éléments manquants avant la dernière relecture."}
          </p>
        </div>
        <span
          className={`flex min-h-8 w-fit items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
            isReady
              ? "bg-secondary text-secondary-foreground"
              : "bg-sunrise-soft text-accent-foreground"
          }`}
        >
          {isReady ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <Circle className="size-4" aria-hidden="true" />
          )}
          {isReady ? "Prête à relire" : "À compléter"}
        </span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Progression de la préparation de la fiche"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={`${completedCount} éléments prêts sur ${checklist.length}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {checklist.map((item) => (
          <li key={item.id}>
            {item.complete ? (
              <span className="flex min-h-11 items-center gap-2 rounded-lg bg-secondary/45 px-3 text-sm font-medium text-primary-dark">
                <CheckCircle2
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {item.label}
                <span className="sr-only"> : renseigné</span>
              </span>
            ) : (
              <a
                href={item.href}
                className="group flex min-h-11 items-center gap-2 rounded-lg bg-muted px-3 text-sm font-medium text-foreground outline-none transition-colors duration-150 hover:bg-sunrise-soft focus-visible:ring-[3px] focus-visible:ring-ring/25"
              >
                <Circle
                  className="size-4 shrink-0 text-sunrise"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">{item.label}</span>
                <ArrowDownRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-y-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
                <span className="sr-only"> : accéder à la section</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
