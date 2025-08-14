import { getHikes } from "@/action/hike.action";
import { HikeFilter } from "@/model/hike.model";
import { useQuery } from "@tanstack/react-query";

export const useHikeFilters = (filter: HikeFilter) => {
  return useQuery({
    queryKey: ["hikes", filter],
    queryFn: () => getHikes(filter),
    select: (data) => data.data ?? [],
    enabled: !!filter.title,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
