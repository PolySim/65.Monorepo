import AdminCategoryHeader from "@/components/admin/adminCategoryHeader";
import AdminHikeList from "@/components/admin/adminHikeList";
import { Suspense } from "react";
import CreateCategoryContainer from "./createCategoryContainer";

export default function CategoryAdminPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <AdminCategoryHeader />
        <Suspense fallback={<div className="skeleton h-11 w-44 rounded-lg" />}>
          <CreateCategoryContainer />
        </Suspense>
      </div>
      <Suspense fallback={<div className="skeleton min-h-80 rounded-xl" />}>
        <AdminHikeList />
      </Suspense>
    </div>
  );
}
