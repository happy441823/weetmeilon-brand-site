export function HeroVisual() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/12 bg-hero-radial p-5 shadow-purple">
      <div className="cyber-grid pointer-events-none absolute inset-0 z-0 opacity-60" />
      <div className="float-slow pointer-events-none absolute right-6 top-8 z-0 h-52 w-52 rounded-[54px] bg-mint-gradient opacity-80 blur-[1px]" />
      <div className="float-alt pointer-events-none absolute bottom-10 left-5 z-0 h-44 w-44 rounded-full border border-mint-300/32 bg-white/8 backdrop-blur" />
      <div className="relative z-10 flex h-full flex-col justify-between rounded-[26px] border border-white/10 bg-ink/34 p-6 backdrop-blur-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-mint-300">Native Skin Silicone</p>
          <p className="mt-5 max-w-sm text-5xl font-black leading-[0.96] tracking-tight text-white md:text-7xl">
            原生
            <br />
            肌凝硅
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {["柔软", "回弹", "细腻"].map((item) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4">
              <p className="text-2xl font-black text-mint-300">{item}</p>
              <p className="mt-1 text-xs leading-5 text-aura/58">材质体验目标</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
