"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories } from "@/queries/categories.queries";
import { useDifficulties } from "@/queries/difficulty.query";
import { Loader2 } from "lucide-react";
import CreateCategory from "./createCategory";

export default function CreateCategoryContainer() {
  const { isPending: isPendingDifficulties } = useDifficulties();
  const { isPending: isPendingCategories } = useCategories();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Créer une activité</Button>
      </DialogTrigger>
      <DialogContent className="w-11/12 max-w-4xl">
        <DialogHeader>
          <DialogTitle>Créer une activité</DialogTitle>
        </DialogHeader>
        {isPendingDifficulties || isPendingCategories ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <CreateCategory />
        )}
      </DialogContent>
    </Dialog>
  );
}
