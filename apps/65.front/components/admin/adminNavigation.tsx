"use client";

import { cn } from "@/lib/utils";
import { useCategories } from "@/queries/categories.queries";
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  MountainSnow,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const AdminNavigation = () => {
  const pathname = usePathname();
  const { data: categories, isPending, isError, refetch } = useCategories();
  const activeCategoryRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeCategoryRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }, [categories, pathname]);

  return (
    <aside
      className="lg:sticky lg:top-[6.5rem] lg:self-start"
      aria-label="Navigation d’administration"
    >
      <div className="rounded-xl bg-sidebar p-3 text-sidebar-foreground shadow-[0_0_0_1px_oklch(0.2_0.02_155/0.055)]">
        <div className="hidden px-3 pb-4 pt-2 lg:block">
          <p className="font-bold">Espace administration</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Contenus et itinéraires
          </p>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto lg:flex-col"
          aria-label="Sections d’administration"
          aria-busy={isPending}
        >
          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25",
              pathname === "/admin"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <LayoutDashboard className="size-[1.125rem]" aria-hidden="true" />
            Vue d’ensemble
          </Link>

          {isPending ? (
            <>
              <span className="sr-only" role="status">
                Chargement des catégories
              </span>
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className="skeleton h-11 w-36 shrink-0 rounded-lg lg:w-full"
                  aria-hidden="true"
                />
              ))}
            </>
          ) : isError ? (
            <button
              type="button"
              onClick={() => void refetch()}
              className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25"
            >
              <RefreshCw className="size-[1.125rem]" aria-hidden="true" />
              Recharger les catégories
            </button>
          ) : (categories ?? []).length > 0 ? (
            categories?.map((category) => {
              const href = `/admin/categories/${category.id}`;
              const active =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={category.id}
                  ref={active ? activeCategoryRef : undefined}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <FolderTree className="size-[1.125rem]" aria-hidden="true" />
                  <span className="max-w-44 truncate">{category.name}</span>
                </Link>
              );
            })
          ) : (
            <p className="flex min-h-11 shrink-0 items-center px-3 text-sm text-muted-foreground">
              Aucune catégorie
            </p>
          )}

          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25 lg:mt-3 lg:border-t lg:border-sidebar-border lg:pt-3"
          >
            <MountainSnow className="size-[1.125rem]" aria-hidden="true" />
            Voir le site
            <span className="sr-only"> (nouvel onglet)</span>
            <ExternalLink className="ml-auto size-3.5" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default AdminNavigation;
