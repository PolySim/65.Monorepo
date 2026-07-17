"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHikeById } from "@/queries/hike.queries";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ImagesCarroussel from "./ImagesCarroussel";

const ImageContainer = ({
  children,
  imageId,
  imageLabel,
  className,
}: {
  children: React.ReactNode;
  imageId: string;
  imageLabel: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: hike } = useHikeById();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCount = hike?.images?.length ?? 0;

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const element = containerRef.current;
      if (!element || imageCount === 0) return;
      const nextIndex = Math.min(Math.max(index, 0), imageCount - 1);
      element.scrollTo({
        left: nextIndex * element.clientWidth,
        behavior,
      });
      setActiveIndex(nextIndex);
    },
    [imageCount],
  );

  const onNavigate = useCallback(
    (direction: -1 | 1) => {
      scrollToIndex(activeIndex + direction);
    },
    [activeIndex, scrollToIndex],
  );

  const onScroll = () => {
    const element = containerRef.current;
    if (!element || element.clientWidth === 0) return;
    const nextIndex = Math.round(element.scrollLeft / element.clientWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), imageCount - 1));
  };

  useEffect(() => {
    if (!isOpen) return;

    const keyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onNavigate(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          onNavigate(1);
          break;
      }
    };

    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [isOpen, onNavigate]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          const index =
            hike?.images?.findIndex((image) => image.id === imageId) ?? 0;
          setActiveIndex(Math.max(index, 0));
        }
        setIsOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={imageLabel}
          className={cn(
            "group relative w-full cursor-zoom-in overflow-hidden rounded-xl outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none active:translate-y-0 motion-reduce:transform-none",
            className,
          )}
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent
        onContextMenu={(event) => event.preventDefault()}
        onOpenAutoFocus={() => {
          window.requestAnimationFrame(() =>
            scrollToIndex(activeIndex, "auto"),
          );
        }}
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none bg-foreground p-0 shadow-none sm:p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            Galerie photo — {hike?.title ?? "Randonnée"}
          </DialogTitle>
          <DialogDescription>
            Utilisez les boutons ou les flèches gauche et droite du clavier pour
            parcourir les photos.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          onScroll={onScroll}
          className="disable_scrollbar flex h-dvh w-screen snap-x snap-mandatory overflow-x-auto scroll-smooth"
          aria-label="Photos de la randonnée"
        >
          <ImagesCarroussel />
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsOpen(false)}
          aria-label="Fermer la galerie"
          className="absolute top-4 left-4 z-10 bg-card text-foreground shadow-sm hover:bg-muted"
        >
          <XIcon aria-hidden="true" />
          <span className="hidden sm:inline">Fermer</span>
        </Button>

        <p
          className="absolute top-4 left-1/2 z-10 min-h-11 -translate-x-1/2 rounded-lg bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-sm"
          aria-live="polite"
        >
          {activeIndex + 1} / {imageCount}
        </p>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onNavigate(-1)}
          disabled={activeIndex === 0}
          aria-label="Afficher la photo précédente"
          className="absolute top-1/2 left-3 z-10 -translate-y-1/2 bg-card text-foreground shadow-sm hover:bg-muted sm:left-5"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onNavigate(1)}
          disabled={activeIndex >= imageCount - 1}
          aria-label="Afficher la photo suivante"
          className="absolute top-1/2 right-3 z-10 -translate-y-1/2 bg-card text-foreground shadow-sm hover:bg-muted sm:right-5"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImageContainer;
