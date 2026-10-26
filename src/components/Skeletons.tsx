/** Esqueletos de carregamento: a tela responde no toque, antes dos dados chegarem. */
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function RankingSkeleton() {
  return (
    <div className="pt-[max(0.75rem,env(safe-area-inset-top))]" aria-busy aria-label="Carregando">
      <div className="px-5">
        <Bar className="h-11 w-32" />
        <Bar className="mt-6 h-12 w-4/5" />
        <Bar className="mt-3 h-12 w-3/5" />
        <Bar className="mt-5 h-4 w-3/4" />
        <div className="mt-7 flex gap-2">
          {[0, 1, 2].map((i) => (
            <Bar key={i} className="h-11 w-28" />
          ))}
        </div>
      </div>
      <div className="skeleton mt-10 aspect-[4/5]" />
    </div>
  );
}

export function PlaceSkeleton() {
  return (
    <div aria-busy aria-label="Carregando">
      <div className="skeleton h-[62svh] min-h-[420px]" />
      <div className="space-y-3 px-5 pt-7">
        <Bar className="h-7 w-full" />
        <Bar className="h-7 w-4/5" />
        <Bar className="mt-8 h-9 w-1/2" />
        <Bar className="h-5 w-3/4" />
        <Bar className="h-5 w-2/3" />
      </div>
    </div>
  );
}
