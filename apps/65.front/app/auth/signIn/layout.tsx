import { MountainSnow } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace 65 Passion Montagne.",
};

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      id="contenu-principal"
      className="grid min-h-screen bg-background lg:grid-cols-[1.08fr_0.92fr]"
    >
      <section
        className="relative hidden min-h-screen overflow-hidden bg-primary-dark lg:block"
        aria-label="Paysage des Hautes-Pyrénées"
      >
        <Image
          src="/fond_ecran.png"
          alt="Panorama enneigé des Hautes-Pyrénées"
          fill
          priority
          sizes="55vw"
          className="object-cover outline outline-1 -outline-offset-1 outline-black/10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75" />
        <Link
          href="/"
          className="absolute top-8 left-8 flex items-center gap-3 rounded-lg text-white outline-none focus-visible:ring-[3px] focus-visible:ring-white/35"
          aria-label="65 Passion Montagne — Accueil"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-white text-primary-dark">
            <MountainSnow className="size-5" aria-hidden="true" />
          </span>
          <span className="font-bold">65 Passion Montagne</span>
        </Link>
        <div className="absolute inset-x-0 bottom-0 max-w-2xl p-8 text-white xl:p-12">
          <p className="text-3xl font-bold leading-tight tracking-[-0.03em] xl:text-4xl">
            Préparez la sortie. Gardez l’essentiel sous la main.
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
            Itinéraires, photos, traces GPX et favoris réunis dans votre espace
            personnel.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex w-fit items-center gap-3 rounded-lg text-primary-dark outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 lg:hidden"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              65
            </span>
            <span className="font-bold">Passion Montagne</span>
          </Link>
          {children}
          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
            Accès réservé aux membres de 65 Passion Montagne.
          </p>
        </div>
      </section>
    </main>
  );
}
