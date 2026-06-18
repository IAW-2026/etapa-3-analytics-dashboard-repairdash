interface PageTitleProps {
  title: string;
  subtitle: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-bold m-0" style={{ fontFamily: 'var(--font-grotesk)', fontSize: 'clamp(22px, 3vw, 27px)', letterSpacing: '-.015em' }}>{title}</h1>
      <p className="text-sm m-0" style={{ color: 'var(--text2)' }}>{subtitle}</p>
    </div>
  );
}
