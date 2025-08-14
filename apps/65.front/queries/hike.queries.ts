import {
  getHikeById,
  getHikeFavorites,
  getHikes,
  toggleFavorite,
} from "@/action/hike.action";
import { useAppParams } from "@/hook/useAppParams";
import { HikeFilter, HikeSearch } from "@/model/hike.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useHikeFilters = (
  filter?: HikeFilter & { isFavorites?: boolean }
) => {
  const { categoryId, stateId } = useAppParams();
  const newFilter = { ...(filter || {}), categoryId, stateId };

  return useQuery({
    queryKey: ["hikes", newFilter],
    queryFn: () => getHikes(newFilter),
    select: (data) => data.data ?? [],
    enabled:
      !filter?.isFavorites &&
      (!!newFilter.title || !!newFilter.categoryId || !!newFilter.stateId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useHikeById = () => {
  const { hikeId } = useAppParams();

  return useQuery({
    queryKey: ["hike", hikeId],
    queryFn: () => getHikeById(hikeId),
    select: (data) => data.data,
    enabled: !!hikeId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useHikeFavorites = (isFavorites?: boolean) => {
  return useQuery({
    queryKey: ["hikes", "favorites"],
    queryFn: async () => {
      const data = await getHikeFavorites();
      return data.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: isFavorites,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { hikeId } = useAppParams();

  return useMutation({
    mutationFn: () => toggleFavorite(hikeId),
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["hikes", "favorites"] });
      const previousHikes = queryClient.getQueryData(["hikes", "favorites"]);
      queryClient.setQueryData(["hikes", "favorites"], (old: HikeSearch[]) => {
        return old.some((hike) => hike.id === hikeId)
          ? old.filter((hike) => hike.id !== hikeId)
          : [...old, { id: hikeId }];
      });
      return { previousHikes };
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de l'ajout/retrait des favoris");
        queryClient.setQueryData(
          ["hikes", "favorites"],
          context?.previousHikes
        );
      }
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de l'ajout/retrait des favoris");
      queryClient.setQueryData(["hikes", "favorites"], context?.previousHikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hikes", "favorites"] });
    },
  });
};
