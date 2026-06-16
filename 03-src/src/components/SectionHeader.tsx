type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-mint-300">{eyebrow}</p> : null}
      <h2 className="whitespace-pre-line text-balance text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-8 text-aura/68 md:text-lg">{description}</p> : null}
    </div>
  );
}
