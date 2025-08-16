import { getDifficulties } from "@/action/difficulty.action";
import { useQuery } from "@tanstack/react-query";

export const useDifficulties = () => {
  return useQuery({
    queryKey: ["difficulties"],
    queryFn: getDifficulties,
    select: (data) => data.data ?? [],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
