"use client";

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
import HikeUpdateInformation from "./hikeUpdateInformation";

export default function UpdateInformationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPending: isPendingDifficulties } = useDifficulties();
  const { isPending: isPendingCategories } = useCategories();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-11/12 max-w-4xl">
        <DialogHeader>
          <DialogTitle>Modifier une activité</DialogTitle>
        </DialogHeader>
        {isPendingDifficulties || isPendingCategories ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <HikeUpdateInformation />
        )}
      </DialogContent>
    </Dialog>
  );
}
