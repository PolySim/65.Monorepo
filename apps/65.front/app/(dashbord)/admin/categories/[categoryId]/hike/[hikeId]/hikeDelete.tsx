"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteHike } from "@/queries/hike.queries";
import { Loader2, Trash2 } from "lucide-react";

const HikeDelete = () => {
  const { mutate: deleteHike, isPending } = useDeleteHike();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          <span>Supprimer l&apos;activité</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;activité</DialogTitle>
          <DialogDescription className="leading-6">
            Cette action supprimera définitivement la randonnée, ses photos et
            son tracé GPS. Elle ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-1">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteHike()}
            disabled={isPending}
          >
            {isPending && (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HikeDelete;
