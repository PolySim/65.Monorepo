"use client";

import { Button } from "@/components/ui/button";
import { useHikeById } from "@/queries/hike.queries";
import { AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import HikeDescription from "./hikeDescription";
import HikeGPXContainer from "./hikeGPXContainer";
import HikeGlobalInformation from "./hikeGlobalInformation";
import HikeHeader from "./hikeHeader";

const HikePhoto = dynamic(() => import("./hikePhoto"), { ssr: false });

const HikeEditorSkeleton = () => (
  <div
    className="page-container flex flex-1 flex-col gap-5 py-4 sm:py-6 lg:py-8"
    aria-label="Chargement de la randonnée"
    aria-busy="true"
  >
    <div className="surface overflow-hidden">
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-64 w-full sm:h-80" />
    </div>
    <div className="surface h-56" />
    <div className="surface h-72" />
  </div>
);

export default function HikeContainer() {
  const { data: hike, isPending, isError, refetch } = useHikeById();

  if (isPending) return <HikeEditorSkeleton />;

  if (isError || !hike) {
    return (
      <div className="page-container flex flex-1 items-center justify-center py-10">
        <section
          className="surface flex max-w-lg flex-col items-center gap-4 p-6 text-center sm:p-8"
          aria-labelledby="hike-load-error-title"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 id="hike-load-error-title" className="text-lg font-semibold">
              Impossible de charger cette activité
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Vérifiez votre connexion, puis réessayez. Aucune modification n’a
              été effectuée.
            </p>
          </div>
          <Button type="button" onClick={() => void refetch()}>
            Réessayer
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-1 flex-col gap-5 py-4 sm:py-6 lg:py-8">
      <HikeHeader />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <HikeGlobalInformation />
        <HikeDescription />
      </div>
      <HikePhoto />
      <HikeGPXContainer />
    </div>
  );
}
