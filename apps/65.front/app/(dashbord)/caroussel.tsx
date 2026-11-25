import DesktopPicture from "@/components/desktop-picture";

const Caroussel = () => {
  return (
    <div
      className="relative hidden h-[29rem] grid-cols-[1.35fr_0.8fr] grid-rows-2 gap-3 lg:grid"
      aria-label="Paysages des Hautes-Pyrénées"
    >
      <figure className="relative row-span-2 overflow-hidden rounded-xl">
        <DesktopPicture
          srcSet="/Home/soleil-750.webp 750w, /Home/soleil-1440.webp 1440w"
          sizes="696px"
          alt="Panorama ensoleillé sur les sommets des Hautes-Pyrénées"
          className="absolute inset-0 size-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
        <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 p-4 text-sm font-medium text-white">
          Des itinéraires choisis pour découvrir le 65 autrement.
        </figcaption>
      </figure>
      <div className="relative overflow-hidden rounded-xl">
        <DesktopPicture
          srcSet="/Home/neige-480.webp 480w, /Home/neige-900.webp 900w"
          sizes="423px"
          alt="Crêtes enneigées sous un ciel bleu"
          className="absolute inset-0 size-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
      </div>
      <div className="relative overflow-hidden rounded-xl">
        <DesktopPicture
          srcSet="/Home/refuge-480.webp 480w, /Home/refuge-900.webp 900w"
          sizes="402px"
          alt="Refuge de montagne dans les Hautes-Pyrénées"
          className="absolute inset-0 size-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
        />
      </div>
    </div>
  );
};

export default Caroussel;
