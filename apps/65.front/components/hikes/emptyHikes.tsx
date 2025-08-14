"use client";

import { Clock, Compass, MapPin, Mountain, TreePine } from "lucide-react";

export default function EmptyHikes() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 flex-1">
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="relative">
            <Compass size={48} className="text-blue-500 mb-2" />
            <TreePine
              size={24}
              className="text-green-500 absolute -bottom-1 -right-1"
            />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-3">
        Aucune activité pour le moment
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Commencez votre aventure !
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Mountain size={24} className="text-green-600" />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">Randonnées</h3>
          <p className="text-sm text-gray-600">
            Explorez les sentiers et sommets
          </p>
        </div>
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <MapPin size={24} className="text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">Circuits</h3>
          <p className="text-sm text-gray-600">Découvrez de nouvelles routes</p>
        </div>
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock size={24} className="text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">Suivi</h3>
          <p className="text-sm text-gray-600">Enregistrez vos performances</p>
        </div>
      </div>
    </div>
  );
}
