import Image from "next/image";

const Caroussel = () => {
  return (
    <div
      className="relative hidden h-[29rem] grid-cols-[1.35fr_0.8fr] grid-rows-2 gap-3 lg:grid"
      aria-label="Paysages des Hautes-Pyrénées"
    >
      <figure className="relative row-span-2 overflow-hidden rounded-xl">
        <Image
          src="/Home/soleil.png"
          alt="Panorama ensoleillé sur les sommets des Hautes-Pyrénées"
          fill
          priority
          sizes="(min-width: 1024px) 38vw, 0px"
          className="object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 p-4 text-sm font-medium text-white">
          Des itinéraires choisis pour découvrir le 65 autrement.
        </figcaption>
      </figure>
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src="/Home/neige.png"
          alt="Crêtes enneigées sous un ciel bleu"
          fill
          sizes="(min-width: 1024px) 20vw, 0px"
          className="object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
      </div>
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src="/Home/refuge.png"
          alt="Refuge de montagne dans les Hautes-Pyrénées"
          fill
          sizes="(min-width: 1024px) 20vw, 0px"
          className="object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
      </div>
    </div>
  );
};

export default Caroussel;
