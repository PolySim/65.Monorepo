export default function HikePageSkeleton() {
  return (
    <div className="page-container" role="status">
      <span className="sr-only">Chargement de la randonnée…</span>
      <div aria-hidden="true">
        <div className="skeleton mb-3 h-11 w-38 rounded-md sm:mb-5" />
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-8 lg:gap-12">
          <div>
            <div className="skeleton h-8 w-4/5 rounded sm:h-10 lg:h-12" />
            <div className="skeleton mt-3 h-5 w-2/3 rounded" />
            <div className="mt-4 border-t pt-3 sm:mt-5">
              <div className="skeleton h-10 w-5/6 rounded" />
            </div>
            <div className="skeleton mt-4 h-11 w-3/4 rounded-md sm:mt-5" />
          </div>
          <div className="skeleton aspect-[16/10] rounded-md md:aspect-[4/3] lg:aspect-[16/10]" />
        </div>
      </div>
    </div>
  );
}
