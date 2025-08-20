"use client";

import { useHikeById } from "@/queries/hike.queries";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

const HikeDescription = () => {
  const { data: hike } = useHikeById();
  const [activeTab, setActiveTab] = useState<"description" | "indications">(
    hike?.content ? "description" : "indications"
  );
  return (
    !!(hike?.content || hike?.indication) && (
      <>
        <div className="px-4 bg-white">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {!!hike.content && (
                <button
                  onClick={() => setActiveTab("description")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "description"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Info size={16} />
                    Description
                  </div>
                </button>
              )}

              {!!hike.indication && (
                <button
                  onClick={() => setActiveTab("indications")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "indications"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Indications
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Contenu des onglets */}
          {activeTab === "description" && (
            <div className="prose max-w-none">
              {hike?.content?.split("\n").map((line, index) => (
                <p
                  key={index}
                  className="text-gray-700 leading-relaxed text-lg"
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {activeTab === "indications" && (
            <div className="prose max-w-none">
              {hike?.indication?.split("\n").map((line, index) => (
                <p
                  key={index}
                  className="text-gray-700 leading-relaxed text-lg"
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </>
    )
  );
};

export default HikeDescription;
