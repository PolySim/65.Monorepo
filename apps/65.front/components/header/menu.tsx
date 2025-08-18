"use client";

import { config } from "@/config/config";
import { cn } from "@/lib/utils";
import { Category } from "@/model/category.model";
import { useCategories } from "@/queries/categories.queries";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

const Menu = () => {
  const [categoryHover, setCategoryHover] = useState<Category | null>(null);
  const { data: categories } = useCategories();

  const toggleOpen = (open: boolean) => {
    if (!open) setCategoryHover(null);
    else setCategoryHover(categories?.[0] ?? null);
  };

  return (
    <HoverCard onOpenChange={toggleOpen}>
      <HoverCardTrigger asChild>
        <Button variant="ghost" className="font-semibold">
          Catégories
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-fit flex gap-2 p-2">
        {categories ? (
          <div className="flex flex-col">
            {categories.map((category) => (
              <Link
                onMouseEnter={() => setCategoryHover(category)}
                key={category.id}
                href={`/categories/${category.id}`}
                className={cn(
                  "hover:text-primary hover:bg-primary/10 px-2 py-1 rounded-sm",
                  {
                    "bg-primary/10 text-primary":
                      categoryHover?.id === category.id,
                  }
                )}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
        <div
          className={cn("w-72 bg-white", {
            "grid grid-cols-2 gap-2": (categoryHover?.states ?? []).length > 0,
          })}
        >
          {(categoryHover?.states ?? []).length > 0 ? (
            (categoryHover?.states ?? []).map((state) => (
              <Link
                key={state.id}
                href={`/categories/${categoryHover?.id}/states/${state.id}`}
                className="relative rounded-sm w-[135px] h-[80px] overflow-hidden hover:scale-105 transition-all duration-300"
              >
                <Image
                  src={`${config.IMAGE_URL}?path=${state.image_path}&rotate=0`}
                  alt={state.name}
                  width={270}
                  height={160}
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 left-0 top-0 right-0 flex justify-center items-center bg-black/20">
                  <p className="text-tertiary text-sm font-bold">
                    {state.name}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <Link
              href={`/categories/${categoryHover?.id}`}
              className="w-full h-full"
            >
              <Image
                src={`${config.IMAGE_URL}?path=${categoryHover?.image_path}&rotate=0`}
                alt={categoryHover?.name ?? ""}
                width={600}
                height={800}
                className="rounded-sm object-cover w-[300px] h-[400px]"
              />
            </Link>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default Menu;
