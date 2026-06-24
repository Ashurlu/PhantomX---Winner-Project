import { ArrowButton, Eyebrow, Reveal, STACK, MARQUEE } from "./shared";

export function StackPage() {
  return (
    <>
      <section className="sec-black px-6 pb-16 pt-40">
        <div className="mx-auto max-w-[1344px]">
          <Reveal><Eyebrow className="!text-[var(--gray-light)]">Stack</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h1 className="rf-display mt-6 max-w-4xl text-[clamp(3rem,8vw,6.5rem)]" style={{ color: "var(--white)" }}>
              Built on <span style={{ color: "var(--sage)" }}>open</span> standards.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg" style={{ color: "var(--gray-light)" }}>
              No black boxes. PhantomX is assembled from the security tools your team
              already trusts.
            </p>
          </Reveal>
        </div>
      </section>

      {/* marquee */}
      <section className="sec-ink overflow-hidden py-10">
        <div className="rf-marquee">
          {[...MARQUEE, ...MARQUEE].map((s, i) => (
            <span key={i} className="rf-display text-3xl md:text-5xl" style={{ color: i % 2 ? "var(--sage)" : "var(--white)" }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="sec-white px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1344px] gap-px md:grid-cols-2" style={{ background: "rgba(30,30,30,0.12)" }}>
          {STACK.map((s, i) => (
            <Reveal key={s.name} delay={(i % 2) * 0.08} className="bg-[var(--white)]">
              <div className="flex h-full flex-col p-9 md:p-11">
                <h3 className="rf-display text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>{s.name}</h3>
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--charcoal)" }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec-black px-6 py-24 text-center">
        <Reveal><ArrowButton to="/overview" variant="light">Launch console</ArrowButton></Reveal>
      </section>
    </>
  );
}
