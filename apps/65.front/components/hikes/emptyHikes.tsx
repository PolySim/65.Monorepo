import { Button } from "@/components/ui/button";
import { Compass, Heart, Plus } from "lucide-react";
import Link from "next/link";

export default function EmptyHikes({
  isFavorites,
  isAdmin,
}: {
  isFavorites?: boolean;
  isAdmin?: boolean;
}) {
  const Icon = isFavorites ? Heart : isAdmin ? Plus : Compass;
  const title = isFavorites
    ? "Aucun favori enregistré"
    : isAdmin
      ? "Aucune activité dans cette catégorie"
      : "Aucune activité trouvée";
  const description = isFavorites
    ? "Enregistrez les sorties qui vous intéressent pour les retrouver rapidement ici."
    : isAdmin
      ? "Créez une première activité avec le bouton situé en haut de la page."
      : "Cette sélection ne contient pas encore d’activité. Explorez une autre catégorie ou un autre massif.";

  return (
    <div className="surface flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl bg-secondary text-primary-dark">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {isFavorites || !isAdmin ? (
        <Button className="mt-6" asChild>
          <Link href="/">Explorer les activités</Link>
        </Button>
      ) : null}
    </div>
  );
}
