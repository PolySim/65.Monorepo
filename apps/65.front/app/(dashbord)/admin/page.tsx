"use client";

import { config } from "@/config/config";
import { useCategories } from "@/queries/categories.queries";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const { data: categories, isPending } = useCategories();

  return (
    <div className="flex-1 bg-primary/10 flex flex-col m-4 rounded-xl">
      {isPending ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
          {(categories || []).map((category) => (
            <Link
              key={category.id}
              href={`/admin/categories/${category.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-48 h-40 bg-primary">
                  <Image
                    src={`${config.IMAGE_URL}?path=${category?.image_path ?? ""}`}
                    alt={category.name}
                    width={384}
                    height={256}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>

                {/* Contenu principal */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
