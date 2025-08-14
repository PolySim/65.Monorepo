"use client";

import { Button } from "@/components/ui/button";
import { Hike } from "@/model/hike.model";
import { Download, Navigation } from "lucide-react";

const HikeGPX = ({ hike }: { hike: Hike }) => {
  return (
    <div className="p-6 bg-white mt-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Navigation size={24} />
          Tracé GPX
        </h2>
        <Button>
          <Download size={20} />
          Télécharger
        </Button>
      </div>
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        <div className="text-center">
          <Navigation size={48} className="text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Carte interactive du parcours</p>
          <p className="text-sm text-gray-500">
            Cliquez sur "Voir sur la carte" pour ouvrir
          </p>
        </div>
      </div>
    </div>
  );
};

export default HikeGPX;
