import { useState } from "react";
import { Check } from "lucide-react";
import {
  ArrowButton,
  ConsoleMock,
  Eyebrow,
  GoldLink,
  Reveal,
  STATS,
  INTRO_CARDS,
  CAPABILITIES,
  IMPACT_METRICS,
  SERVICE_PLANS,
} from "./shared";
import { AnimatedCounter } from "./AnimatedCounter";
import { RotatingWord } from "./heroFx";

export function Home() {
  return (
    <>
      {/* ---- Hero (black) ---- */}
      <section className="sec-black relative flex min-h-screen items-center overflow-hidden px-6 pt-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img
            src="/images/welcome-hero-bg.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.15) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 35%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1344px]">
          <Reveal>
            <Eyebrow className="!text-[var(--gray-light)]">Autonomous SOC · MITRE ATT&CK native</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="rf-display mt-6 max-w-5xl text-[clamp(3rem,9vw,7.5rem)]" style={{ color: "var(--white)" }}>
              For those who dare to <RotatingWord />
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed" style={{ color: "var(--gray-light)" }}>
              PhantomX triages alerts, argues verdicts, and validates detections against
              MITRE ATT&CK — so your analysts only ever see what is real.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap gap-3">
              <ArrowButton to="/overview" variant="light">Request a demo</ArrowButton>
              <ArrowButton to="/modules" variant="outline">Explore the platform</ArrowButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Delivering outcomes (cream) ---- */}
      <section className="sec-cream px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-[1344px] items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal><Eyebrow>Delivering security outcomes</Eyebrow></Reveal>
            <Reveal delay={0.05}>
              <h2 className="rf-display mt-5 text-[clamp(2.25rem,5vw,4.5rem)]" style={{ color: "var(--ink)" }}>
                Noise removed at machine speed.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: "var(--charcoal)" }}>
                Every alert flows through ingestion, autonomous triage, adjudication, and
                live adversary validation. What reaches an analyst is already real.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8"><ArrowButton to="/how-it-works" variant="dark">Learn more</ArrowButton></div>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <ConsoleMock />
          </Reveal>
        </div>
      </section>

      {/* ---- Business impact (animated counters) ---- */}
      <ImpactMetricsSection />

      {/* ---- Stats band (ink) ---- */}
      <section className="sec-ink px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1344px]">
          <Reveal><Eyebrow className="!text-[var(--gray-mid)]">PhantomX by the numbers</Eyebrow></Reveal>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <Eyebrow className="!text-[var(--gray-mid)]">{s.label}</Eyebrow>
                <div className="rf-rule my-5" />
                <div className="rf-display text-[clamp(3.5rem,7vw,6rem)]" style={{ color: "var(--white)" }}>{s.value}</div>
                <p className="mt-3 text-sm" style={{ color: "var(--gray-light)" }}>{s.caption}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Three intro cards (white) ---- */}
      <section className="sec-white px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-[1344px] gap-px md:grid-cols-3" style={{ background: "rgba(30,30,30,0.12)" }}>
          {INTRO_CARDS.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.08} className="bg-[var(--white)]">
              <div className="flex h-full flex-col p-9">
                <h3 className="rf-display text-2xl md:text-3xl" style={{ color: "var(--ink)" }}>
                  <span className="rf-ul">{c.key}</span>{c.rest}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: "var(--charcoal)" }}>{c.desc}</p>
                <div className="mt-6"><GoldLink to={c.to}>Read more →</GoldLink></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- Platform capability stack (ink, sticky rail) ---- */}
      <PlatformStack />

      {/* ---- BPaaS pricing ---- */}
      <PricingSection />

      {/* ---- CTA (black) ---- */}
      <section className="sec-black px-6 pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-[1344px] text-center">
          <Reveal>
            <h2 className="rf-display mx-auto max-w-4xl text-[clamp(2.5rem,7vw,6rem)] leading-[1.02]" style={{ color: "var(--white)" }}>
              See only what is <span style={{ color: "var(--sage)" }}>real</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-12 flex justify-center md:mt-14">
              <ArrowButton to="/overview" variant="light">Launch console</ArrowButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ImpactMetricsSection() {
  return (
    <section className="sec-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1344px]">
        <Reveal>
          <Eyebrow className="!text-[var(--gray-mid)]">Business process outcomes</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="rf-display mt-5 max-w-3xl text-[clamp(2.25rem,5vw,4.5rem)]"
            style={{ color: "var(--white)" }}
          >
            Measured impact across the SOC.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: "var(--gray-light)" }}>
            PhantomX runs alert triage, adjudication, and validation as a managed service — so
            your team reclaims time and budget from noise, not from headcount cuts.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px md:grid-cols-3" style={{ background: "rgba(188,188,188,0.14)" }}>
          {IMPACT_METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.1} className="bg-[var(--black)]">
              <div className="flex h-full flex-col p-8 md:p-10">
                <Eyebrow className="!text-[var(--gray-mid)]">{m.label}</Eyebrow>
                <div className="rf-rule my-6" />
                <div
                  className="rf-display text-[clamp(2.5rem,6vw,4.5rem)] tabular-nums"
                  style={{ color: "var(--sage)" }}
                >
                  <AnimatedCounter
                    value={m.value}
                    prefix={m.prefix}
                    suffix={m.suffix}
                    format={m.format}
                    duration={2.4 + i * 0.2}
                  />
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: "var(--gray-light)" }}>
                  {m.caption}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="sec-cream px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1344px]">
        <Reveal>
          <Eyebrow>Business process as a service</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2
            className="rf-display mt-5 max-w-3xl text-[clamp(2.25rem,5vw,4.5rem)]"
            style={{ color: "var(--ink)" }}
          >
            Managed SOC automation plans.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: "var(--charcoal)" }}>
            Choose the tier that matches your alert volume and adjudication depth. Every plan
            includes autonomous triage, audit trails, and MITRE-native reporting.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {SERVICE_PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08}>
              <div
                className="rf-card flex h-full flex-col p-8 md:p-9"
                style={{
                  borderColor: plan.featured ? "var(--sage)" : undefined,
                  borderWidth: plan.featured ? 2 : 1,
                  background: plan.featured ? "var(--white)" : "transparent",
                }}
              >
                {plan.featured ? (
                  <span
                    className="rf-mono mb-4 inline-block w-fit px-2 py-1 text-[10px]"
                    style={{ background: "var(--sage)", color: "var(--ink)" }}
                  >
                    Most popular
                  </span>
                ) : (
                  <span className="mb-4 block h-[26px]" aria-hidden />
                )}

                <Eyebrow>{plan.tagline}</Eyebrow>
                <h3 className="rf-display mt-3 text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--charcoal)" }}>
                  {plan.description}
                </p>

                <div className="rf-rule my-6" />

                <div className="flex items-baseline gap-1">
                  {plan.price != null ? (
                    <>
                      <span className="rf-display text-5xl tabular-nums" style={{ color: "var(--ink)" }}>
                        ${plan.price.toLocaleString("en-US")}
                      </span>
                      <span className="rf-mono text-xs" style={{ color: "var(--gray-mid)" }}>
                        / {plan.period}
                      </span>
                    </>
                  ) : (
                    <span className="rf-display text-4xl" style={{ color: "var(--ink)" }}>
                      Custom
                    </span>
                  )}
                </div>

                <ul className="mt-8 flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "var(--charcoal)" }}>
                      <Check
                        size={16}
                        strokeWidth={2.5}
                        style={{ color: "var(--sage)", marginTop: 2, flexShrink: 0 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <ArrowButton
                    to="/overview"
                    variant={plan.featured ? "dark" : "outline"}
                    className="w-full justify-center"
                  >
                    {plan.cta}
                  </ArrowButton>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Sticky-rail capability stack (after the 7AI "Complete Security Operations Stack") ---- */
function PlatformStack() {
  const [active, setActive] = useState(0);
  const cap = CAPABILITIES[active];

  return (
    <section className="sec-ink px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1344px]">
        <Reveal><Eyebrow className="!text-[var(--gray-mid)]">The complete security operations stack</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="rf-display mt-5 max-w-3xl text-[clamp(2.25rem,5vw,4.5rem)]" style={{ color: "var(--white)" }}>
            One platform. Six operators.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-[300px_1fr]">
          {/* left rail */}
          <div className="flex flex-col self-start border-y" style={{ borderColor: "rgba(188,188,188,0.18)" }}>
            {CAPABILITIES.map((c, i) => {
              const on = i === active;
              return (
                <button
                  key={c.id}
                  className="rf-tab border-b"
                  style={{
                    borderBottomColor: "rgba(188,188,188,0.14)",
                    backgroundColor: on ? "#9fb5ad" : "transparent",
                    borderLeft: on ? "2px solid #1e1e1e" : "2px solid transparent",
                  }}
                  onClick={() => setActive(i)}
                >
                  <span className="rf-display block text-xl" style={{ color: on ? "var(--ink)" : "var(--white)" }}>{c.title}</span>
                  <Eyebrow className={on ? "!text-[rgba(30,30,30,0.65)]" : "!text-[var(--gray-mid)]"}>{c.subtitle}</Eyebrow>
                </button>
              );
            })}
          </div>

          {/* right panel */}
          <div className="border p-8 md:p-12" style={{ borderColor: "rgba(188,188,188,0.18)" }}>
            <Eyebrow className="!text-[var(--sage)]">{cap.subtitle}</Eyebrow>
            <h3 className="rf-display mt-4 text-4xl md:text-6xl" style={{ color: "var(--white)" }}>{cap.title}</h3>
            <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: "var(--gray-light)" }}>{cap.desc}</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {cap.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 border-t pt-4" style={{ borderColor: "rgba(188,188,188,0.18)" }}>
                  <Check size={18} strokeWidth={2.5} style={{ color: "var(--sage)", marginTop: 2, flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: "var(--white)" }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
