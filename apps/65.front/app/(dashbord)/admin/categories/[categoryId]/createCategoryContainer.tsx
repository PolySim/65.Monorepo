"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories } from "@/queries/categories.queries";
import { useDifficulties } from "@/queries/difficulty.query";
import { AlertTriangle, LoaderCircle, Plus, RefreshCw } from "lucide-react";
import CreateCategory from "./createCategory";

export default function CreateCategoryContainer() {
  const difficultiesQuery = useDifficulties();
  const categoriesQuery = useCategories();
  const isPending = difficultiesQuery.isPending || categoriesQuery.isPending;
  const isError = difficultiesQuery.isError || categoriesQuery.isError;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          Créer une activité
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une activité</DialogTitle>
          <DialogDescription>
            Renseignez les informations essentielles. Vous pourrez ajouter la
            description, les photos et la trace GPX à l’étape suivante.
          </DialogDescription>
        </DialogHeader>
        {isPending ? (
          <div
            className="flex min-h-44 items-center justify-center gap-3 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle
              className="size-5 animate-spin text-primary"
              aria-hidden="true"
            />
            Préparation du formulaire…
          </div>
        ) : isError ? (
          <div
            className="flex min-h-44 flex-col items-center justify-center gap-4 text-center"
            role="alert"
          >
            <AlertTriangle className="size-6 text-accent" aria-hidden="true" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Les options nécessaires à la création ne sont pas disponibles.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                difficultiesQuery.refetch();
                categoriesQuery.refetch();
              }}
            >
              <RefreshCw aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        ) : (
          <CreateCategory />
        )}
      </DialogContent>
    </Dialog>
  );
}
