import { getCategories } from "@/action/category.action";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories();
      if (!response.success) {
        throw new Error("Impossible de charger les catégories");
      }
      return response;
    },
    select: (data) => data.data ?? [],
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
