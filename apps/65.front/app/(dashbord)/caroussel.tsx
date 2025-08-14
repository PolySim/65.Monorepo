"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const IMAGES = [
  "/Home/soleil.png",
  "/Home/neige.png",
  "/Home/pano.png",
  "/Home/refuge.png",
];

const Caroussel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const interval = setInterval(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollLeft =
        element.scrollLeft >= 3 * window.innerWidth
          ? 0
          : element.scrollLeft + window.innerWidth;
    }
  }, 10000);

  useEffect(() => {
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex absolute top-0 bottom-0 w-screen overflow-x-hidden scroll-smooth"
      ref={containerRef}
    >
      {IMAGES.map((url, index) => (
        <Image
          src={url}
          alt={`Home screen ${index + 1}`}
          key={url}
          className="h-full w-screen min-w-screen object-cover"
          width={3240}
          height={2160}
        />
      ))}
    </div>
  );
};

export default Caroussel;
