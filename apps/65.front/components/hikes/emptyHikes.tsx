import { Button } from "@/components/ui/button";
import { Compass, Heart, Plus } from "lucide-react";
import Link from "next/link";

export default function EmptyHikes({
  isFavorites,
  isAdmin,
  categoryHref,
}: {
  isFavorites?: boolean;
  isAdmin?: boolean;
  categoryHref?: string;
}) {
  const Icon = isFavorites ? Heart : isAdmin ? Plus : Compass;
  const title = isFavorites
    ? "Aucun favori enregistré"
    : isAdmin
      ? "Aucune activité dans cette catégorie"
      : "Aucune activité trouvée";
  const description = isFavorites
    ? "Sur une fiche, sélectionnez « Favori » pour retrouver la sortie ici."
    : isAdmin
      ? "Créez une première activité avec le bouton situé en haut de la page."
      : "Essayez un autre massif ou une autre catégorie.";

  return (
    <div
      className={`surface flex flex-col items-center justify-center px-6 text-center ${isAdmin ? "min-h-80 py-12" : "py-8 sm:py-12"}`}
    >
      <span className="flex size-14 items-center justify-center rounded-xl bg-secondary text-primary-dark">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {isFavorites || !isAdmin ? (
        <Button className="mt-6" asChild>
          <Link href={categoryHref ?? "/#terrains"}>
            {categoryHref ? "Voir toute la catégorie" : "Voir les catégories"}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
