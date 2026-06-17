interface PageTitleProps {
  title: string;
  subtitle: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-grotesk)', fontSize: 'clamp(22px, 3vw, 27px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-.015em' }}>{title}</h1>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)' }}>{subtitle}</p>
    </div>
  );
}
