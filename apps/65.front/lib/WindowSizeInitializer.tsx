"use client";

import { useWindowSizeStore } from "@/store/windowSize.store";
import { useEffect } from "react";

const WindowSizeInitializer = () => {
  useEffect(() => {
    const handleResize = () => {
      useWindowSizeStore.getState().toggleWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  });
  return null;
};

export default WindowSizeInitializer;
