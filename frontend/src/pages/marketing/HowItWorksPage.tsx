import { ArrowButton, Eyebrow, Reveal, STEPS } from "./shared";

export function HowItWorksPage() {
  return (
    <>
      <section className="sec-black px-6 pb-20 pt-40">
        <div className="mx-auto max-w-[1344px]">
          <Reveal><Eyebrow className="!text-[var(--gray-light)]">How it works</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h1 className="rf-display mt-6 max-w-4xl text-[clamp(3rem,8vw,6.5rem)]" style={{ color: "var(--white)" }}>
              From signal to <span style={{ color: "var(--sage)" }}>certainty</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg" style={{ color: "var(--gray-light)" }}>
              Three stages turn a flood of raw telemetry into a short list of validated,
              real threats.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sec-cream px-6 py-12 md:py-20">
        <div className="mx-auto max-w-[1344px]">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div className="grid items-start gap-6 border-b py-12 md:grid-cols-[200px_1fr] md:py-16" style={{ borderColor: "rgba(30,30,30,0.16)" }}>
                <span className="rf-display text-[clamp(4rem,10vw,9rem)] leading-none" style={{ color: "var(--sage)" }}>{s.n}</span>
                <div>
                  <h3 className="rf-display text-4xl md:text-6xl" style={{ color: "var(--ink)" }}>{s.title}</h3>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--charcoal)" }}>{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec-black px-6 py-24 text-center">
        <Reveal><ArrowButton to="/overview" variant="light">See it live</ArrowButton></Reveal>
      </section>
    </>
  );
}
