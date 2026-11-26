import {
  createHike,
  deleteHike,
  getHikeById,
  getHikeFavorites,
  getHikeSuggestions,
  getHikes,
  setHikeFavorite,
  updateHike,
} from "@/action/hike.action";
import { useAppParams } from "@/hook/useAppParams";
import {
  CreateHikeDto,
  Hike,
  HikeFavoriteStatus,
  HikeFilter,
  HIKE_SUGGESTION_MAX_LENGTH,
  UpdateHikeDto,
} from "@/model/hike.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useHikeFilters = (
  filter?: HikeFilter & { isFavorites?: boolean },
) => {
  const { categoryId, stateId } = useAppParams();
  const newFilter = { ...(filter || {}), categoryId, stateId };

  return useQuery({
    queryKey: ["hikes", newFilter],
    queryFn: async () => {
      const response = await getHikes(newFilter);
      if (!response.success) {
        throw new Error("Impossible de charger les activités");
      }
      return response;
    },
    select: (data) => data.data ?? [],
    enabled:
      !filter?.isFavorites &&
      (!!newFilter.title || !!newFilter.categoryId || !!newFilter.stateId),
  });
};

export const useHikeSuggestions = (term: string, enabled: boolean) =>
  useQuery({
    queryKey: ["hikes", "suggestions", term],
    queryFn: async () => {
      const response = await getHikeSuggestions(term);
      if (!response.success || !response.data) {
        throw new Error("Impossible de charger les suggestions");
      }
      return response.data;
    },
    enabled:
      enabled && term.length >= 2 && term.length <= HIKE_SUGGESTION_MAX_LENGTH,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: false,
  });

export const useHikeById = <TData = Hike>(props?: {
  select?: (data: { data?: Hike }) => TData;
}) => {
  const { hikeId } = useAppParams();

  return useQuery({
    queryKey: ["hike", hikeId],
    queryFn: async () => {
      const response = await getHikeById(hikeId);
      if (!response.success) {
        throw new Error("Impossible de charger cette activité");
      }
      return response;
    },
    select: (data) => (props?.select ? props.select(data) : data.data) as TData,
    enabled: !!hikeId,
  });
};

export const useHikeFavorites = (isFavorites?: boolean) => {
  return useQuery({
    queryKey: ["hikes", "favorites"],
    queryFn: async () => {
      const data = await getHikeFavorites();
      if (!data.success) {
        throw new Error("Impossible de charger vos favoris");
      }
      return data.data ?? [];
    },
    enabled: isFavorites === true,
  });
};

const favoriteStatusKey = (hikeId: string) => ["hike-favorite", hikeId];
const favoritesKey = ["hikes", "favorites"];

export const useHikeFavoriteStatus = (enabled: boolean) => {
  const { hikeId } = useAppParams();
  return useQuery({
    queryKey: favoriteStatusKey(hikeId),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/hikes/${encodeURIComponent(hikeId)}/favorite`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Impossible de charger le statut favori");
      return (await response.json()) as HikeFavoriteStatus;
    },
    enabled: enabled && !!hikeId,
    staleTime: 0,
  });
};

export const useSetFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hikeId,
      isFavorite,
    }: {
      hikeId: string;
      isFavorite: boolean;
    }) => {
      const response = await setHikeFavorite(hikeId, isFavorite);
      if (!response.success || !response.data) {
        throw new Error("Impossible de modifier le favori");
      }
      return response.data;
    },
    onSuccess: async (status, { hikeId }) => {
      const queryKey = favoriteStatusKey(hikeId);
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, status);
    },
    onError: (_error, { hikeId }) => {
      toast.error("Erreur lors de l'ajout/retrait des favoris");
      void queryClient.invalidateQueries({
        queryKey: favoriteStatusKey(hikeId),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesKey });
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
          `/admin/categories/${variables.categoryId}/hike/${data.data?.id}`,
        );
      }
    },
    onError: () => {
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
      queryClient.setQueryData(["hike", hikeId], (old: { data: Hike }) => {
        return {
          data: {
            ...old.data,
            ...hike,
            mainImage:
              old.data.images?.find((image) => image.id === hike.mainImageId) ??
              old.data.mainImage,
          },
        };
      });
      return { previousHike };
    },
    onSuccess: (data, _variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la mise à jour de la randonnée");
        queryClient.setQueryData(["hike", hikeId], context?.previousHike);
      }
    },
    onError: (_error, _variables, context) => {
      toast.error("Erreur lors de la mise à jour de la randonnée");
      queryClient.setQueryData(["hike", hikeId], context?.previousHike);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
    },
  });
};

export const useDeleteHike = () => {
  const queryClient = useQueryClient();
  const { hikeId, categoryId } = useAppParams();
  const router = useRouter();

  return useMutation({
    mutationFn: () => deleteHike(hikeId),
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast.error("Erreur lors de la suppression de la randonnée");
        return;
      }
      toast.success("Activité supprimée");
      router.replace(`/admin/categories/${categoryId}`);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la randonnée");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hikes"] });
    },
  });
};
