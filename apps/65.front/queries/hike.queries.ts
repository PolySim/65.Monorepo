import { getHikes } from "@/action/hike.action";
import { useAppParams } from "@/hook/useAppParams";
import { HikeFilter } from "@/model/hike.model";
import { useQuery } from "@tanstack/react-query";

export const useHikeFilters = (filter?: HikeFilter) => {
  const { categoryId, stateId } = useAppParams();
  const newFilter = { ...(filter || {}), categoryId, stateId };

  return useQuery({
    queryKey: ["hikes", newFilter],
    queryFn: () => getHikes(newFilter),
    select: (data) => data.data ?? [],
    enabled: !!newFilter.title || !!newFilter.categoryId || !!newFilter.stateId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
