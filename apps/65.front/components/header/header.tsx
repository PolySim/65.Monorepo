"use client";

import { useWindowSizeStore } from "@/store/windowSize.store";
import Link from "next/link";
import { Button } from "../ui/button";
import AdminLink from "./adminLink";
import Logout from "./logout";
import MenuContainer from "./menuContainer";

const Header = () => {
  const width = useWindowSizeStore((state) => state.width);
  return (
    <header className="flex justify-between items-center w-full p-2 md:p-4">
      <Link
        href="/"
        className="text-primary-dark font-bebas tracking-[2px] md:tracking-[3px] text-xl md:text-2xl w-fit text-center"
      >
        65 Passion Montagne
      </Link>
      <div className="flex items-center gap-2">
        <MenuContainer />
        {width > 1048 && (
          <Button
            variant="ghost"
            className="text-secondary-dark hover:bg-secondary-dark/20 hover:text-secondary-dark"
            asChild
          >
            <Link href="/favorites">Mes favoris</Link>
          </Button>
        )}
        <AdminLink />
        <Logout />
      </div>
    </header>
  );
};

export default Header;
