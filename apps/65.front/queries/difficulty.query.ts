import { getDifficulties } from "@/action/difficulty.action";
import { useQuery } from "@tanstack/react-query";

export const useDifficulties = () => {
  return useQuery({
    queryKey: ["difficulties"],
    queryFn: async () => {
      const response = await getDifficulties();
      if (!response.success) {
        throw new Error("Impossible de charger les difficultés");
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
