"use client";

import { config } from "@/config/config";
import { UserRole } from "@/model/user.model";
import { useCategories } from "@/queries/categories.queries";
import { useUser } from "@/queries/user.queries";
import { SignOutButton } from "@clerk/nextjs";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu as MenuIcon,
  Settings,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const BurgerMenu = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const { data: categories, isPending, isError, refetch } = useCategories();
  const { data: user } = useUser();
  const isAdmin = user?.data?.roleId === UserRole.ADMIN;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
          <MenuIcon aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-0 right-0 left-auto flex h-dvh max-h-dvh w-[min(25rem,100%)] translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0"
      >
        <DialogHeader className="flex-row items-center justify-between border-b border-border px-5 py-4 text-left">
          <div>
            <DialogTitle>Explorer la montagne</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Catégories, massifs et raccourcis
            </p>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer le menu">
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1" aria-label="Navigation mobile">
            <DialogClose asChild>
              <Link
                href="/favorites"
                className="flex min-h-12 items-center gap-3 rounded-lg px-3 font-semibold text-primary-dark outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                <Heart className="size-5" aria-hidden="true" />
                Mes favoris
              </Link>
            </DialogClose>

            <div className="my-3 h-px bg-border" />
            <p className="px-3 pb-2 text-sm font-semibold text-muted-foreground">
              Activités
            </p>

            {isPending ? (
              <div
                className="space-y-2 px-2"
                role="status"
                aria-label="Chargement des catégories"
              >
                <div className="skeleton h-14 rounded-lg" />
                <div className="skeleton h-14 rounded-lg" />
                <div className="skeleton h-14 rounded-lg" />
              </div>
            ) : isError ? (
              <div
                className="mx-2 rounded-lg bg-sunrise-soft p-4 text-sm text-accent-foreground"
                role="alert"
              >
                <p>Les catégories ne peuvent pas être chargées.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 min-h-10 font-semibold underline underline-offset-4"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              (categories ?? []).map((category) => {
                const hasStates = (category.states ?? []).length > 0;
                const isOpen = openCategory === category.id;

                return (
                  <div key={category.id} className="mb-1">
                    {hasStates ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCategory((current) =>
                            current === category.id ? null : category.id,
                          )
                        }
                        className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20"
                        aria-expanded={isOpen}
                      >
                        <Image
                          src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                          alt=""
                          width={48}
                          height={48}
                          className="size-10 rounded-md object-cover outline outline-1 -outline-offset-1 outline-black/10"
                        />
                        <span className="flex-1">{category.name}</span>
                        <ChevronDown
                          className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <DialogClose asChild>
                        <Link
                          href={`/categories/${category.id}`}
                          className="flex min-h-14 items-center gap-3 rounded-lg px-3 font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20"
                        >
                          <Image
                            src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                            alt=""
                            width={48}
                            height={48}
                            className="size-10 rounded-md object-cover outline outline-1 -outline-offset-1 outline-black/10"
                          />
                          {category.name}
                        </Link>
                      </DialogClose>
                    )}

                    {hasStates && isOpen ? (
                      <div className="ml-7 border-l border-border py-1 pl-4">
                        <DialogClose asChild>
                          <Link
                            href={`/categories/${category.id}`}
                            className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary-dark outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
                          >
                            Toutes les activités
                          </Link>
                        </DialogClose>
                        {category.states.map((state) => (
                          <DialogClose asChild key={state.id}>
                            <Link
                              href={`/categories/${category.id}/states/${state.id}`}
                              className="flex min-h-11 items-center rounded-lg px-3 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/20"
                            >
                              {state.name}
                            </Link>
                          </DialogClose>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </nav>
        </div>

        <div className="space-y-2 border-t border-border bg-muted/45 p-4">
          {isAdmin ? (
            <DialogClose asChild>
              <Button
                variant="secondary"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin">
                  <Settings aria-hidden="true" />
                  Administration
                </Link>
              </Button>
            </DialogClose>
          ) : null}
          <SignOutButton>
            <Button variant="ghost" className="w-full justify-start">
              <LogOut aria-hidden="true" />
              Se déconnecter
            </Button>
          </SignOutButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BurgerMenu;
