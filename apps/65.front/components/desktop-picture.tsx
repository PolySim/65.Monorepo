const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function DesktopPicture({
  srcSet,
  sizes,
  alt,
  className,
}: {
  srcSet: string;
  sizes: string;
  alt: string;
  className: string;
}) {
  return (
    <picture>
      {/* Same breakpoint as Tailwind lg; the mobile fallback never hits the network. */}
      <source
        media="(min-width: 64rem)"
        type="image/webp"
        srcSet={srcSet}
        sizes={sizes}
      />
      <img src={transparentPixel} alt={alt} className={className} />
    </picture>
  );
}
