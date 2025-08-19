import { create } from "zustand";

type MenuStore = {
  isOpen: boolean;
  toggleOpen: () => void;
};

export const useMenuStore = create<MenuStore>((set) => ({
  isOpen: false,
  toggleOpen: () => {
    set((state) => {
      if (state.isOpen) {
        document.body.style.overflow = "auto";
      } else {
        document.body.style.overflow = "hidden";
      }
      return { isOpen: !state.isOpen };
    });
  },
}));
