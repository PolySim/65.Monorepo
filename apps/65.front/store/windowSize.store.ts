import { create } from "zustand";

type UseWindowSizeStore = {
  width: number;
  height: number;
  toggleWindowSize: ({
    width,
    height,
  }: {
    width?: number;
    height?: number;
  }) => void;
};

export const useWindowSizeStore = create<UseWindowSizeStore>()((set) => ({
  width: 0,
  height: 0,
  toggleWindowSize: ({ width, height }) =>
    set((state) => ({
      width: width ?? state.width,
      height: height ?? state.height,
    })),
}));
