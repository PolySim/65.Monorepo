import Caroussel from "./caroussel";
import SearchHikes from "./searchHikes";

export default function Home() {
  return (
    <div className="flex-1 relative flex">
      <Caroussel />
      <div className="flex flex-col gap-4 justify-center items-center flex-1 bg-black/20 z-10">
        <h1 className="text-tertiary font-rubik font-semibold text-3xl md:text-5xl text-center z-10">
          Trouve ton bonheur
        </h1>
        <SearchHikes />
      </div>
    </div>
  );
}
