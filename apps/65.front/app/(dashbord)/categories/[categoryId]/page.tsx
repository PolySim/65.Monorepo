import GridHikes from "@/components/hikes/gridHikes";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function CategoryPage() {
  return (
    <div className="flex-1 bg-primary/10 flex flex-col m-4 rounded-xl">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <GridHikes />
      </Suspense>
    </div>
  );
}
