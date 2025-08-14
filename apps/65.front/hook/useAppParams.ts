import { useParams } from "next/navigation";

export const useAppParams = () => {
  const params = useParams();
  return {
    categoryId: params.categoryId as string,
    stateId: params.stateId as string,
    hikeId: params.hikeId as string,
  };
};
