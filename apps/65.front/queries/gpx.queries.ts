import { getGpxFile } from "@/action/gpx.action";
import { useQuery } from "@tanstack/react-query";

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
