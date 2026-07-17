import { Heart, MountainSnow } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-auto bg-primary-dark text-primary-foreground">
      <div className="page-container flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MountainSnow className="size-5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">65 Passion Montagne</p>
            <p className="mt-1 text-xs text-primary-foreground/75">
              Les Hautes-Pyrénées, chemin après chemin.
            </p>
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          aria-label="Pied de page"
        >
          <Link
            className="rounded underline-offset-4 hover:underline focus-visible:outline-2"
            href="/"
          >
            Explorer
          </Link>
          <Link
            className="flex items-center gap-1.5 rounded underline-offset-4 hover:underline focus-visible:outline-2"
            href="/favorites"
          >
            <Heart className="size-4" aria-hidden="true" />
            Favoris
          </Link>
          <Link
            href="https://www.simondesdevises.com"
            className="rounded text-primary-foreground/75 underline-offset-4 hover:text-primary-foreground hover:underline focus-visible:outline-2"
          >
            © {new Date().getFullYear()} Simon Desdevises
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
