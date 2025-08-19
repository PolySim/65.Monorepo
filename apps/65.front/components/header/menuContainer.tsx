"use client";

import { useWindowSizeStore } from "@/store/windowSize.store";
import BurgerMenu from "./burgerMenu";
import Menu from "./menu";

const MenuContainer = () => {
  const width = useWindowSizeStore((state) => state.width);

  return width > 1048 ? <Menu /> : <BurgerMenu />;
};

export default MenuContainer;
