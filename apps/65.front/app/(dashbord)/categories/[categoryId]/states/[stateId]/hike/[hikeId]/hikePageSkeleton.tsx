export default function HikePageSkeleton() {
  return (
    <div
      className="page-container"
      role="status"
      aria-label="Chargement de la randonnée"
    >
      <div aria-hidden="true">
        <div className="skeleton mb-2 h-11 w-44 rounded-lg" />
        <div className="surface overflow-hidden">
          <div className="skeleton h-36 sm:h-60 lg:h-[23rem]" />
          <div className="space-y-3 p-4 sm:p-6">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-11 w-2/3 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
