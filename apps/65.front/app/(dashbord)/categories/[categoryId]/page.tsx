import CollectionHeader from "@/components/hikes/collectionHeader";
import GridHikes from "@/components/hikes/gridHikes";
import { Suspense } from "react";

export default function CategoryPage() {
  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="page-container">
        <CollectionHeader />
        <Suspense fallback={<div className="skeleton min-h-80 rounded-xl" />}>
          <GridHikes />
        </Suspense>
      </div>
    </div>
  );
}
