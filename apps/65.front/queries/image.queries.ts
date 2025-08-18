import { createImage, deleteImage, rotateImage } from "@/action/image.action";
import { useAppParams } from "@/hook/useAppParams";
import { Hike } from "@/model/hike.model";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateImage = () => {
  const queryClient = useQueryClient();
  const { hikeId } = useAppParams();

  return useMutation({
    mutationFn: (formData: FormData) => createImage({ hikeId, formData }),
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la création de l'image");
      }
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de la création de l'image");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  const { hikeId } = useAppParams();

  return useMutation({
    mutationFn: (imageId: string) => deleteImage(imageId),
    onMutate: (imageId) => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
      const previousHike = queryClient.getQueryData(["hike", hikeId]);
      queryClient.setQueryData(["hike", hikeId], (old: { data: Hike }) => {
        return {
          ...old,
          data: {
            ...old.data,
            images: old.data.images.filter((image) => image.id !== imageId),
          },
        };
      });
      return { previousHike };
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la suppression de l'image");
        queryClient.setQueryData(["hike", hikeId], context?.previousHike);
      }
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de la suppression de l'image");
      queryClient.setQueryData(["hike", hikeId], context?.previousHike);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
    },
  });
};

export const useRotateImage = () => {
  const queryClient = useQueryClient();
  const { hikeId, categoryId, stateId } = useAppParams();
  const newFilter = { categoryId, stateId };

  return useMutation({
    mutationFn: (imageId: string) => rotateImage(imageId, hikeId),
    onMutate: (imageId) => {
      queryClient.cancelQueries({ queryKey: ["hike", hikeId] });
      const previousHike = queryClient.getQueryData(["hike", hikeId]);
      queryClient.setQueryData(["hike", hikeId], (old: { data: Hike }) => {
        const isMainImage = old.data.mainImage?.id === imageId;
        return {
          ...old,
          data: {
            ...old.data,
            mainImage: isMainImage
              ? {
                  ...old.data.mainImage,
                  rotate: (old.data.mainImage?.rotate ?? 0) + 90,
                }
              : old.data.mainImage,
            images: old.data.images.map((image) =>
              image.id === imageId
                ? { ...image, rotate: (image.rotate ?? 0) + 90 }
                : image
            ),
          },
        };
      });
      return { previousHike };
    },
    onSuccess: (data, variables, context) => {
      if (!data.success) {
        toast.error("Erreur lors de la rotation de l'image");
        queryClient.setQueryData(["hike", hikeId], context?.previousHike);
      }
    },
    onError: (error, variables, context) => {
      toast.error("Erreur lors de la rotation de l'image");
      queryClient.setQueryData(["hike", hikeId], context?.previousHike);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["hike", hikeId] });
      queryClient.invalidateQueries({ queryKey: ["hikes", newFilter] });
    },
  });
};
