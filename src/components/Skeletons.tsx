/** Esqueletos de carregamento: a tela responde no toque, antes dos dados chegarem. */
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function RankingSkeleton() {
  return (
    <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))]" aria-busy aria-label="Carregando">
      <Bar className="h-9 w-28" />
      <div className="skeleton mt-6 size-10 rounded-2xl" />
      <Bar className="mt-4 h-10 w-4/5" />
      <Bar className="mt-3 h-4 w-3/5" />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="h-10 w-24" />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="mt-6 overflow-hidden rounded-[1.75rem] border border-line">
          <div className="skeleton aspect-[4/3]" />
          <div className="space-y-3 p-5">
            <Bar className="h-7 w-2/3" />
            <Bar className="h-4 w-1/2" />
            <Bar className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlaceSkeleton() {
  return (
    <div aria-busy aria-label="Carregando">
      <div className="skeleton aspect-square rounded-b-[2rem]" />
      <div className="space-y-3 px-5 pt-6">
        <Bar className="h-10 w-3/4" />
        <Bar className="h-5 w-1/3" />
        <Bar className="mt-6 h-4 w-full" />
        <Bar className="h-4 w-5/6" />
      </div>
    </div>
  );
}
