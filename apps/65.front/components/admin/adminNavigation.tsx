"use client";

import { cn } from "@/lib/utils";
import { ExternalLink, LayoutDashboard, MountainSnow } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminNavigation = () => {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin",
      label: "Vue d’ensemble",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
  ];

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
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25",
                  link.active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[1.125rem]" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/25 lg:mt-3 lg:border-t lg:border-sidebar-border lg:pt-3"
          >
            <MountainSnow className="size-[1.125rem]" aria-hidden="true" />
            Voir le site
            <ExternalLink className="ml-auto size-3.5" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default AdminNavigation;
