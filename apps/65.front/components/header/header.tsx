import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import AdminLink from "./adminLink";
import Logout from "./logout";
import MenuContainer from "./menuContainer";

const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background">
      <div className="page-container flex h-[4.5rem] items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex min-h-11 items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
          aria-label="65 Passion Montagne — Accueil"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none">
            65
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-bold text-primary-dark">Passion</span>
            <span className="mt-1 text-xs font-medium text-muted-foreground">
              Montagne
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <MenuContainer />
          <Button variant="ghost" className="hidden lg:inline-flex" asChild>
            <Link href="/favorites">
              <Heart aria-hidden="true" />
              Favoris
            </Link>
          </Button>
          <div className="hidden items-center gap-1.5 lg:flex">
            <AdminLink />
            <Logout />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
