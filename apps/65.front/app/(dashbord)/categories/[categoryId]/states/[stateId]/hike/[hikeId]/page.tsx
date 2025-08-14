import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import HikeInformation from "./hikeInformation";

export default function HikePage() {
  return (
    <div className="flex-1 bg-primary/10 flex flex-col py-6">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <HikeInformation />
      </Suspense>
    </div>
  );
}
