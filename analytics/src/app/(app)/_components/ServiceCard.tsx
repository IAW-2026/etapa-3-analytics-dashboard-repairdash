import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface ServiceCardStat {
  v: string;
  l: string;
}

interface ServiceCardProps {
  href: string;
  name: string;
  dot: string;
  ok: boolean;
  stats: ServiceCardStat[];
}

export function ServiceCard({ href, name, dot, ok, stats }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5 no-underline text-inherit"
    >
      <div className="flex items-center gap-2.5">
        <span className="size-[9px] rounded-full" style={{ background: dot }} />
        <span className="font-grotesk font-semibold text-[15.5px]">{name}</span>
        <Badge label={ok ? 'Operativa' : 'Sin datos'} variant={ok ? 'ok' : 'danger'} className="ml-auto" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="font-grotesk text-xl font-bold">{s.v}</div>
            <div className="text-xs text-text3">{s.l}</div>
          </div>
        ))}
      </div>
      <span className="text-[13px] font-semibold" style={{ color: dot }}>Ver detalle →</span>
    </Link>
  );
}
