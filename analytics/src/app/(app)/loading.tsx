import { Skeleton } from '@/components/ui/Skeleton';

// Fallback de Suspense del route group: se muestra mientras el Server Component
// de la página consulta las APIs externas (carga inicial y cambios de período).
export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w={240} h={28} />
        <Skeleton w={360} h={16} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton w={120} h={14} />
            <Skeleton w={110} h={30} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Skeleton w={180} h={15} />
            <Skeleton w="100%" h={260} radius={12} />
          </div>
        ))}
      </div>
    </div>
  );
}
