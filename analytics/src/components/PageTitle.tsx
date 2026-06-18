interface PageTitleProps {
  title: string;
  subtitle: string;
}

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-grotesk font-bold m-0 text-[clamp(22px,3vw,27px)] tracking-[-.015em]">{title}</h1>
      <p className="text-sm text-text2 m-0">{subtitle}</p>
    </div>
  );
}
