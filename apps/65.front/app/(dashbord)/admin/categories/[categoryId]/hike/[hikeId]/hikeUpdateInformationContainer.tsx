"use client";

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
import { Button } from "@/components/ui/button";
import { useState } from "react";
import HikeUpdateInformation from "./hikeUpdateInformation";

export default function UpdateInformationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const difficulties = useDifficulties();
  const categories = useCategories();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Informations de l’activité</DialogTitle>
          <DialogDescription className="leading-6">
            Modifiez le nom, la difficulté et le secteur, puis enregistrez pour
            mettre à jour la fiche.
          </DialogDescription>
        </DialogHeader>
        {difficulties.isPending || categories.isPending ? (
          <div
            className="grid gap-4 sm:grid-cols-2"
            aria-label="Chargement du formulaire"
            aria-busy="true"
          >
            <div className="skeleton h-11 rounded-lg sm:col-span-2" />
            <div className="skeleton h-11 rounded-lg" />
            <div className="skeleton h-11 rounded-lg" />
          </div>
        ) : difficulties.isError || categories.isError ? (
          <div className="space-y-4" role="alert">
            <p className="text-sm text-muted-foreground">
              Impossible de charger les options du formulaire.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void difficulties.refetch();
                void categories.refetch();
              }}
            >
              Réessayer
            </Button>
          </div>
        ) : (
          <HikeUpdateInformation onUpdated={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
