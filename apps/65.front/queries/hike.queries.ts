import {
  createHike,
  getHikeById,
  getHikeFavorites,
  getHikes,
  toggleFavorite,
  updateHike,
} from "@/action/hike.action";
import { useAppParams } from "@/hook/useAppParams";
import {
  CreateHikeDto,
  Hike,
  HikeFilter,
  HikeSearch,
  UpdateHikeDto,
} from "@/model/hike.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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

export const useCreateHike = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (hike: CreateHikeDto) => createHike(hike),
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["hikes"] });
    },
    onSuccess: (data, variables) => {
      if (!data.success) {
        toast.error("Erreur lors de la création de la randonnée");
      } else {
        router.push(
          `/admin/categories/${variables.categoryId}/hike/${data.data?.id}`
        );
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la randonnée");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
    },
  });
};

export const useUpdateHike = () => {
  const queryClient = useQueryClient();
  const { hikeId } = useAppParams();

  return useMutation({
    mutationFn: (hike: Omit<UpdateHikeDto, "id">) =>
      updateHike({ ...hike, id: hikeId }),
    onMutate: (hike) => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
      const previousHike = queryClient.getQueryData(["hike", hikeId]);
      queryClient.setQueryData(["hike", hikeId], (old: Hike) => {
        return { ...old, ...hike };
      });
      return { previousHike };
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la mise à jour de la randonnée");
        queryClient.setQueryData(["hike", hikeId], context?.previousHike);
      }
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de la mise à jour de la randonnée");
      queryClient.setQueryData(["hike", hikeId], context?.previousHike);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
    },
  });
};
