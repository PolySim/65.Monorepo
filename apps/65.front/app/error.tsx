"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main
      id="contenu-principal"
      className="flex min-h-[70vh] items-center py-12"
    >
      <div className="page-container">
        <div className="surface mx-auto max-w-2xl px-6 py-12 text-center sm:px-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-sunrise-soft text-accent-foreground">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            La page n’a pas pu être chargée
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Une difficulté temporaire empêche l’affichage de ces informations.
            Vous pouvez relancer la page ou revenir à l’accueil.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}>
              <RefreshCw aria-hidden="true" />
              Réessayer
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Revenir à l’accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
