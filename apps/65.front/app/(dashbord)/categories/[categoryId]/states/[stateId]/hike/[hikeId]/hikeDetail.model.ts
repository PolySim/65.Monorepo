import type { Hike } from "@/model/hike.model";

// Keep this snapshot separate from the editable admin query, whose shape differs.
export const hikeDetailKey = (id: string) => ["hike-detail", id] as const;

export function toHikeDetail(hike: Hike) {
  return {
    id: hike.id,
    title: hike.title,
    content: hike.content,
    indication: hike.indication,
    distance: hike.distance,
    duration: hike.duration,
    elevation: hike.elevation,
    mainImagePosition: hike.mainImagePosition,
    mainImage: hike.mainImage
      ? { path: hike.mainImage.path, rotate: hike.mainImage.rotate }
      : null,
    images: hike.images?.map(({ id, path, rotate }) => ({ id, path, rotate })) ?? [],
    gpxFiles: hike.gpxFiles?.map(({ path }) => ({ path })) ?? [],
    state: hike.state ? { name: hike.state.name } : null,
    category: hike.category ? { name: hike.category.name } : null,
    difficulty: hike.difficulty ? { name: hike.difficulty.name } : null,
  };
}

export type HikeDetail = ReturnType<typeof toHikeDetail>;
