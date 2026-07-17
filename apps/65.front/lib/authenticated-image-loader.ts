import type { ImageLoaderProps } from "next/image";

export default function authenticatedImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const source = new URL(src, "http://media.local");
  const path = source.searchParams.get("path");

  if (!path) return src;

  const parameters = new URLSearchParams({
    path,
    quality: String(quality ?? 82),
    rotate: source.searchParams.get("rotate") ?? "0",
    width: String(width),
  });

  return `/api/images?${parameters.toString()}`;
}
