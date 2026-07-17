import { Suspense } from "react";
import HikeContainer from "./hikeContainer";

const HikeEditorSkeleton = () => (
  <div
    className="page-container flex flex-1 flex-col gap-5 py-4 sm:py-6 lg:py-8"
    aria-label="Chargement de l’éditeur de randonnée"
    aria-busy="true"
  >
    <div className="surface overflow-hidden">
      <div className="flex min-h-16 items-center gap-3 border-b border-border p-4">
        <div className="skeleton h-11 w-28 rounded-lg" />
        <div className="skeleton h-11 w-36 rounded-lg" />
      </div>
      <div className="skeleton h-64 w-full sm:h-80" />
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="surface h-56 p-5">
        <div className="skeleton h-5 w-40 rounded-md" />
      </div>
      <div className="surface h-56 p-5">
        <div className="skeleton h-5 w-48 rounded-md" />
      </div>
    </div>
  </div>
);

export default function HikeAdminPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <Suspense fallback={<HikeEditorSkeleton />}>
        <HikeContainer />
      </Suspense>
    </div>
  );
}
