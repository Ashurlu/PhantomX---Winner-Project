import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PhantomXMark } from "@/components/Logo";
import { NavMegaMenu } from "./NavMegaMenu";
import { NAV_MENUS } from "./nav-menus";
import { MarketingNavLink, useMarketingHashScroll } from "./marketing-nav-link";

const FOOTER_LINKS = [
  { to: "/modules", label: "Platform" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/stack", label: "Stack" },
  { to: "/#pricing", label: "Pricing" },
];

export function MarketingLayout() {
  const [scrolled, setScrolled] = useState(false);
  useMarketingHashScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="theme-refined min-h-screen w-full overflow-x-hidden">
      {/* ---- Sticky nav: transparent over hero, solid on scroll ---- */}
      <header
        className="fixed inset-x-0 top-0 z-50 overflow-visible transition-colors duration-300"
        style={{
          background: scrolled ? "var(--ink)" : "transparent",
          borderBottom: scrolled ? "1px solid rgba(188,188,188,0.16)" : "1px solid transparent",
        }}
      >
        <nav className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center">
            <span className="rf-display flex items-center text-2xl tracking-tight" style={{ color: "var(--white)" }}>
              PHANTOM
              <PhantomXMark size={22} className="ml-1" core="#9fb5ad" />
            </span>
          </Link>

          <div className="hidden items-center gap-8 overflow-visible md:flex">
            {NAV_MENUS.map((menu) => (
              <NavMegaMenu key={menu.label} menu={menu} />
            ))}
          </div>

          <Link to="/overview" className="rf-btn rf-btn-light">
            Request a demo
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </nav>
      </header>

      <Outlet />

      {/* ---- Footer ---- */}
      <footer
        className="sec-black border-t px-6 pb-14 pt-20 md:pb-20 md:pt-28"
        style={{ borderColor: "rgba(188,188,188,0.16)" }}
      >
        <div className="mx-auto max-w-[1344px]">
          <div className="grid gap-16 lg:grid-cols-[1.35fr_1fr] lg:gap-24">
            <div className="flex flex-col">
              <span className="rf-display flex items-center text-2xl md:text-3xl" style={{ color: "var(--white)" }}>
                PHANTOM
                <PhantomXMark size={26} className="ml-1.5" core="#9fb5ad" />
              </span>
              <h2
                className="rf-display mt-12 max-w-2xl text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.08] md:mt-16"
                style={{ color: "var(--white)" }}
              >
                PhantomX shifts the SOC&apos;s busywork to autonomous agents.
              </h2>
              <p className="mt-8 max-w-lg text-base leading-relaxed" style={{ color: "var(--gray-light)" }}>
                Autonomous triage, AI adjudication, and MITRE-native validation — delivered as a
                managed service for modern security teams.
              </p>
            </div>
            <nav className="flex flex-col gap-4 md:items-end md:pt-2 lg:pt-4">
              <p className="rf-eyebrow mb-2 !text-[var(--gray-mid)]">Navigate</p>
              <Link to="/" className="rf-mono text-sm transition-colors hover:text-[var(--sage)]" style={{ color: "var(--gray-light)" }}>Home</Link>
              {FOOTER_LINKS.map((l) => (
                <MarketingNavLink
                  key={l.to}
                  to={l.to}
                  className="rf-mono text-sm transition-colors hover:text-[var(--sage)]"
                  style={{ color: "var(--gray-light)" }}
                >
                  {l.label}
                </MarketingNavLink>
              ))}
              <Link to="/login" className="rf-mono text-sm transition-colors hover:text-[var(--sage)]" style={{ color: "var(--gray-light)" }}>Sign in</Link>
              <Link to="/overview" className="rf-mono text-sm transition-colors hover:text-[var(--sage)]" style={{ color: "var(--gray-light)" }}>Console</Link>
            </nav>
          </div>
          <div className="rf-rule mt-20 md:mt-28" />
          <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center md:mt-10">
            <span className="rf-mono text-xs" style={{ color: "var(--gray-mid)" }}>© PhantomX · XDR / SOC command platform</span>
            <span className="rf-mono text-xs" style={{ color: "var(--gray-mid)" }}>
              <span className="rf-ul">Privacy</span> · <span className="rf-ul">Security</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
