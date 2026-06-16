const traits = ["柔软", "回弹表现", "细腻", "清洁与保养"];

export function MaterialVisual() {
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[34px] border border-white/10 bg-hero-radial p-6 shadow-purple">
      <div className="cyber-grid pointer-events-none absolute inset-0 z-0 opacity-45" />
      <div className="pointer-events-none absolute right-[-40px] top-[-30px] z-0 h-64 w-64 rounded-[72px] bg-mint-gradient opacity-60 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[-70px] left-[-40px] z-0 h-72 w-72 rounded-full border border-mint-300/28 bg-white/8 backdrop-blur" />
      <div className="relative z-10 flex min-h-[372px] flex-col justify-between rounded-[28px] border border-white/10 bg-ink/34 p-6 backdrop-blur-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">SWEETMEILON MATERIAL</p>
          <h3 className="mt-5 max-w-xl text-balance text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
            原生肌凝硅
            <span className="mt-2 block bg-mint-gradient bg-clip-text text-transparent">材质质感升级</span>
          </h3>
          <p className="mt-5 max-w-xl text-sm leading-7 text-aura/68">
            以柔和光效和材质曲线呈现品牌材质概念，用于帮助理解柔软、回弹与日常保养等体验方向。
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {traits.map((trait, index) => (
            <div key={trait} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4">
              <p className="text-xs font-black text-mint-300">0{index + 1}</p>
              <p className="mt-2 text-xl font-black text-white">{trait}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
