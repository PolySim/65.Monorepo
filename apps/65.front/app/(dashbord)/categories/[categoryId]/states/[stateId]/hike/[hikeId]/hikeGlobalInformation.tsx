"use client";

import { Hike } from "@/model/hike.model";
import { Clock, MapPin, Mountain } from "lucide-react";

const HikeGlobalInformation = ({ hike }: { hike: Hike }) => {
  return (
    !!(hike.distance || hike.duration || hike.elevation) && (
      <div className="p-6 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {!!hike.distance && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Distance</div>
                <div className="text-gray-600">{hike.distance} km</div>
              </div>
            </div>
          )}

          {!!hike.duration && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock size={24} className="text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Durée</div>
                <div className="text-gray-600">{hike.duration}</div>
              </div>
            </div>
          )}

          {!!hike.elevation && (
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mountain size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Dénivelé</div>
                <div className="text-gray-600">{hike.elevation} m</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default HikeGlobalInformation;
