"use client";

import useDebounce from "@/hook/useDebonce";
import { useHikeFilters } from "@/queries/hike.queries";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const SearchHikes = () => {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: hikes, isPending } = useHikeFilters({ title: search });

  const onSearch = (value: string) => {
    const inputValue = inputRef.current?.value;
    if (value !== inputValue) return;
    setSearch(value);
  };

  const onChange = useDebounce(onSearch, 500);

  return (
    <div className="flex flex-col relative">
      <div className="flex items-center gap-2 rounded-full border border-gray-300 p-2 w-[40rem] max-w-[95vw] bg-white z-20">
        <Search className="w-4 h-4" />
        <input
          type="text"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setSearch(inputRef.current?.value ?? "")}
          onBlur={() => setSearch("")}
          placeholder="Recherche des randos, escalades, refuges ..."
          className="text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden w-full"
          ref={inputRef}
        />
      </div>
      {!!search && (
        <div className="absolute top-[1rem] left-0 w-full max-h-72 min-h-20 overflow-y-auto z-10 pt-6 bg-white rounded-b-3xl">
          {isPending ? (
            <div className="flex items-center justify-center min-h-[inherit]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (hikes || []).length > 0 ? (
            (hikes || []).map((hike) => (
              <Link
                key={hike.id}
                href={`/category/${hike.category.id}/state/${hike.state.id}/hike/${hike.id}`}
                className="w-full p-2 hover:bg-primary/10 cursor-pointer flex justify-between items-center"
              >
                <p className="font-semibold">{hike.title}</p>
                <p className="text-gray-500 text-sm">
                  <span>{hike.state.name}</span> -{" "}
                  <span>{hike.category.name}</span>
                </p>
              </Link>
            ))
          ) : (
            <div className="flex items-center justify-center h-full min-h-[inherit]">
              <p className="text-gray-500">Aucun rando trouvé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchHikes;
