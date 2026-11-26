"use client";

import { useAppParams } from "@/hook/useAppParams";
import { skipToken, useQuery } from "@tanstack/react-query";
import { hikeDetailKey, type HikeDetail } from "./hikeDetail.model";

export function useHikeDetail() {
  const { hikeId } = useAppParams();
  // The account's provider receives the snapshot from the route; refreshing
  // it is a navigation, not a client detail query or a Server Action.
  return useQuery<HikeDetail>({ queryKey: hikeDetailKey(hikeId), queryFn: skipToken }).data;
}
