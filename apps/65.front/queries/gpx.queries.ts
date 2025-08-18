import { createGpxFile, getGpxFile } from "@/action/gpx.action";
import { useAppParams } from "@/hook/useAppParams";
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
      queryClient.invalidateQueries({ queryKey: ["gpx", hikeId] });
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
