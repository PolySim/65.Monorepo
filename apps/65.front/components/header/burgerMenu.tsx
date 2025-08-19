"use client";

import { config } from "@/config/config";
import { cn } from "@/lib/utils";
import { Category } from "@/model/category.model";
import { State } from "@/model/state.model";
import { useCategories } from "@/queries/categories.queries";
import { useMenuStore } from "@/store/menu.store";
import { ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import BurgerMenuTrigger from "./burgerMenuTrigger";

const BurgerMenu = () => {
  const isOpen = useMenuStore((state) => state.isOpen);
  const [categoryOpen, setCategoryOpen] = useState<Category | null>(null);
  const { data: categories, isPending } = useCategories();
  const router = useRouter();

  const onClickCategory = (category: Category) => {
    if (category.states && category.states.length > 0) {
      setCategoryOpen((curr) => (curr?.id === category.id ? null : category));
      return;
    }
    useMenuStore.getState().toggleOpen();
    router.push(`/categories/${category.id}`);
    setCategoryOpen(null);
  };

  const onClickState = (state: State | null) => {
    if (!categoryOpen) return;
    useMenuStore.getState().toggleOpen();
    if (state) {
      router.push(`/categories/${categoryOpen.id}/states/${state.id}`);
    } else {
      router.push(`/categories/${categoryOpen.id}`);
    }
    setCategoryOpen(null);
  };

  const onClickFavorites = () => {
    useMenuStore.getState().toggleOpen();
    router.push("/favorites");
    setCategoryOpen(null);
  };

  return (
    <>
      <BurgerMenuTrigger />
      <div
        className={cn(
          "max-h-screen overflow-y-scroll flex flex-col items-start gap-4 fixed top-0 left-0 w-full h-full overflow-x-hidden transition-transform duration-300 bg-white font-bold font-helvetica text-md text-center z-20",
          {
            "-translate-x-full": !isOpen,
          }
        )}
      >
        {isPending ? (
          <div className="flex justify-center items-center h-full p-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div
              onClick={onClickFavorites}
              className="flex items-center gap-2 w-full p-2 border-b border-gray-200 cursor-pointer"
            >
              <span className="w-12 h-12" />
              <p>Voir mes favoris</p>
            </div>
            {(categories ?? []).map((category) => (
              <React.Fragment key={category.id}>
                <div
                  onClick={() => onClickCategory(category)}
                  className="flex items-center gap-2 w-full p-2 border-b border-gray-200 cursor-pointer"
                >
                  <Image
                    src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                    alt={category.name}
                    width={100}
                    height={100}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <p>{category.name}</p>
                  {category.states && category.states.length > 0 && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        {
                          "rotate-90": categoryOpen?.id === category.id,
                        }
                      )}
                    />
                  )}
                </div>
                {category.states &&
                  category.states.length > 0 &&
                  categoryOpen?.id === category.id && (
                    <div>
                      <div
                        onClick={() => onClickState(null)}
                        className="flex items-center gap-2 w-full ml-4 p-2 border-b border-gray-200 cursor-pointer"
                      >
                        <Image
                          src={`${config.IMAGE_URL}?path=${category.image_path}&rotate=0`}
                          alt={category.name}
                          width={100}
                          height={100}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <p>Voir tous pour {category.name}</p>
                      </div>
                      {category.states.map((state) => (
                        <div
                          onClick={() => onClickState(state)}
                          key={state.id}
                          className="flex items-center gap-2 w-full ml-4 p-2 border-b border-gray-200 cursor-pointer"
                        >
                          <Image
                            src={`${config.IMAGE_URL}?path=${state.image_path}&rotate=0`}
                            alt={category.name}
                            width={100}
                            height={100}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <p>{state.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default BurgerMenu;
