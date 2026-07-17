export default function Loading() {
  return (
    <main
      id="contenu-principal"
      className="flex min-h-[70vh] items-center py-10"
    >
      <div className="page-container" role="status">
        <span className="sr-only">Chargement de la page</span>
        <div className="space-y-4">
          <div className="skeleton h-5 w-36 rounded" />
          <div className="skeleton h-12 w-full max-w-xl rounded-lg" />
          <div className="skeleton h-5 w-full max-w-2xl rounded" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface overflow-hidden">
              <div className="skeleton aspect-[16/10]" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
