import { Check } from "lucide-react";
import { ArrowButton, Eyebrow, Reveal, CAPABILITIES } from "./shared";

export function ModulesPage() {
  return (
    <>
      <section className="sec-black px-6 pb-20 pt-40">
        <div className="mx-auto max-w-[1344px]">
          <Reveal><Eyebrow className="!text-[var(--gray-light)]">Platform</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h1 className="rf-display mt-6 max-w-4xl text-[clamp(3rem,8vw,6.5rem)]" style={{ color: "var(--white)" }}>
              One platform. <span style={{ color: "var(--sage)" }}>Six</span> operators.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg" style={{ color: "var(--gray-light)" }}>
              Each module is autonomous on its own and compounding together — from first
              alert to validated defense.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sec-ink px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1344px] gap-px md:grid-cols-2" style={{ background: "rgba(188,188,188,0.18)" }}>
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.id} delay={(i % 2) * 0.08} className="bg-[var(--ink)]">
              <div id={c.id} className="scroll-mt-32 flex h-full flex-col p-9 md:p-11">
                <Eyebrow className="!text-[var(--sage)]">{c.subtitle}</Eyebrow>
                <h3 className="rf-display mt-3 text-3xl md:text-4xl" style={{ color: "var(--white)" }}>{c.title}</h3>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--gray-light)" }}>{c.desc}</p>
                <ul className="mt-7 grid gap-3">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <Check size={16} strokeWidth={2.5} style={{ color: "var(--sage)", marginTop: 2, flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--gray-light)" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec-black px-6 py-24 text-center">
        <Reveal><ArrowButton to="/overview" variant="light">Open the console</ArrowButton></Reveal>
      </section>
    </>
  );
}
