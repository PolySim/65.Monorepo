import { createGpxFile, deleteGpxFile, getGpxFile } from "@/action/gpx.action";
import { useAppParams } from "@/hook/useAppParams";
import { Hike } from "@/model/hike.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGpxFile = (path: string) => {
  return useQuery({
    queryKey: ["gpx", path],
    queryFn: () => getGpxFile(path),
    enabled: !!path,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (data) => data.data ?? null,
  });
};

export const useCreateGpxFile = () => {
  const { hikeId } = useAppParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: FormData) => createGpxFile(hikeId ?? "", file),
    onMutate: (file) => {
      queryClient.cancelQueries({ queryKey: ["gpx", hikeId] });
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast.error("Erreur lors de la création du fichier GPX");
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du fichier GPX");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
    },
  });
};

export const useDeleteGpxFile = () => {
  const { hikeId } = useAppParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteGpxFile(hikeId ?? ""),
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
      const previousHike = queryClient.getQueryData(["hike", hikeId]);
      queryClient.setQueryData(["hike", hikeId], (old: { data: Hike }) => {
        return {
          ...old,
          data: {
            ...old.data,
            gpxFiles: [],
          },
        };
      });
      return { previousHike };
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de la suppression du fichier GPX");
      queryClient.setQueryData(["hike", hikeId], context?.previousHike);
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la suppression du fichier GPX");
        queryClient.setQueryData(["hike", hikeId], context?.previousHike);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
    },
  });
};
