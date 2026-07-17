"use client";

import { useAppParams } from "@/hook/useAppParams";
import { useCategories } from "@/queries/categories.queries";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const AdminCategoryHeader = () => {
  const { categoryId } = useAppParams();
  const { data: categories, isPending } = useCategories();
  const category = categories?.find((item) => item.id === categoryId);

  return (
    <div>
      <nav
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Fil d’Ariane"
      >
        <Link
          className="rounded outline-none hover:text-primary-dark hover:underline focus-visible:ring-2"
          href="/admin"
        >
          Administration
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span aria-current="page">{category?.name ?? "Catégorie"}</span>
      </nav>
      {isPending ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Chargement de la catégorie</span>
          <div className="skeleton h-10 w-64 rounded-lg" />
          <div className="skeleton h-5 w-full max-w-xl rounded" />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            {category?.name ?? "Activités"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Créez, relisez et mettez à jour les activités visibles dans cette
            catégorie.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminCategoryHeader;
