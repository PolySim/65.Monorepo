import { Button } from "@/components/ui/button";
import { MapPinned } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="contenu-principal"
      className="flex min-h-[70vh] items-center py-12"
    >
      <div className="page-container">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-secondary text-primary-dark">
            <MapPinned className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-semibold text-primary">Erreur 404</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            Cet itinéraire n’existe pas
          </h1>
          <p className="mt-4 text-muted-foreground">
            Le contenu a peut-être été déplacé ou supprimé. Reprenez votre
            exploration depuis l’accueil.
          </p>
          <Button className="mt-7" asChild>
            <Link href="/">Explorer les activités</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
