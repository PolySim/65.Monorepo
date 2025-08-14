"use client";

import { Search } from "lucide-react";

const SearchHikes = () => {
  const onChange = (value: string) => {
    console.log(value);
  };

  return (
    <div className="flex flex-col relative">
      <div className="flex items-center gap-2 rounded-full border border-gray-300 p-2 w-[40rem] max-w-[95vw] bg-white z-20">
        <Search className="w-4 h-4" />
        <input
          type="text"
          onChange={(e) => onChange(e.target.value)}
          placeholder="Recherche des randos, escalades, refuges ..."
          className="text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden w-full"
        />
      </div>
      {[].length > 0 && (
        <div className="absolute top-[1.8125rem] left-0 w-full max-h-72 overflow-y-auto z-10 pt-[1.8125rem] bg-white rounded-b-3xl">
          {/* {[].map((hiking, index) => (
            <CategoryIdStateStateId.Link
              categoryId={hiking.categoriesId.toString()}
              stateId={hiking.state_id.toString()}
              legacyBehavior
              key={hiking.id}
            >
              <div
                className={cn(
                  "w-full py-3 px-[3.625rem] hover:bg-yellow-light cursor-pointer",
                  {
                    "bg-yellow-light": indexFocus === index,
                  }
                )}
              >
                <p className="text-base">{hiking.title}</p>
                <p className="text-gray-500 text-sm">
                  <span>{hiking.state}</span> - <span>{hiking.difficulty}</span>
                </p>
              </div>
            </CategoryIdStateStateId.Link>
          ))} */}
        </div>
      )}
    </div>
  );
};

export default SearchHikes;
