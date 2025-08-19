"use client";

import { cn } from "@/lib/utils";
import { useMenuStore } from "@/store/menu.store";

const BurgerMenuTrigger = () => {
  const isOpen = useMenuStore((state) => state.isOpen);

  return (
    <div className="fixed top-0 right-0 w-fit p-5 z-[100000000] pointer-events-auto">
      <div
        className="ml-auto w-10 h-10 cursor-pointer bg-black/10 backdrop-blur-[10px] rounded-xl p-2 transition-all duration-300 ease-in-out border border-white/20 hover:bg-black/20 hover:scale-105"
        onClick={useMenuStore.getState().toggleOpen}
      >
        <div
          className={cn(
            "w-full h-[3px] bg-white my-1 transition-all duration-300 ease-in-out rounded-sm",
            {
              "transform rotate-[135deg] translate-y-[7px]": isOpen,
            }
          )}
        ></div>
        <div
          className={cn(
            "w-full h-[3px] bg-white my-1 transition-all duration-300 ease-in-out rounded-sm",
            {
              "opacity-0": isOpen,
            }
          )}
        ></div>
        <div
          className={cn(
            "w-full h-[3px] bg-white my-1 transition-all duration-300 ease-in-out rounded-sm",
            {
              "transform -rotate-[135deg] -translate-y-[7px]": isOpen,
            }
          )}
        ></div>
      </div>
    </div>
  );
};

export default BurgerMenuTrigger;
