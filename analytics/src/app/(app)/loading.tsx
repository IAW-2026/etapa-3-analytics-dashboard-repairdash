import { Skeleton } from '@/components/ui/Skeleton';

// Fallback de Suspense del route group: se muestra mientras el Server Component
// de la página consulta las APIs externas (carga inicial y cambios de período).
export default function Loading() {
  return (
    <div className="flex flex-col gap-[22px] max-w-[1280px] mx-auto">
      <div className="flex flex-col gap-2">
        <Skeleton w={240} h={28} />
        <Skeleton w={360} h={16} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2.5">
            <Skeleton w={120} h={14} />
            <Skeleton w={110} h={30} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5">
            <Skeleton w={180} h={15} />
            <Skeleton w="100%" h={260} radius={12} />
          </div>
        ))}
      </div>
    </div>
  );
}
