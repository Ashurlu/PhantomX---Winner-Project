import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { MarketingNavLink } from "./marketing-nav-link";
import type { NavLinkItem, NavMenu } from "./nav-menus";

function allItems(menu: NavMenu): NavLinkItem[] {
  if (menu.grid) return menu.grid;
  return menu.sections?.flatMap((s) => s.items) ?? [];
}

function NavDropdownLink({
  item,
  active,
  onHover,
  onNavigate,
}: {
  item: NavLinkItem;
  active: boolean;
  onHover: () => void;
  onNavigate: () => void;
}) {
  return (
    <MarketingNavLink
      to={item.to}
      className="rf-nav-item block px-4 py-3.5 transition-colors"
      style={{ background: active ? "var(--cream)" : undefined }}
      onMouseEnter={onHover}
      onFocus={onHover}
      onNavigate={onNavigate}
    >
      <span
        className="rf-mono block text-[13px] leading-tight transition-colors"
        style={{ color: active ? "var(--sage)" : "var(--ink)" }}
      >
        {item.label}
      </span>
      <span
        className="mt-1 block line-clamp-2 text-[12px] leading-snug"
        style={{ color: "var(--charcoal)", fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}
      >
        {item.desc}
      </span>
    </MarketingNavLink>
  );
}

function NavPreviewPanel({
  detail,
  onNavigate,
}: {
  detail: NavLinkItem["detail"];
  onNavigate: () => void;
}) {
  return (
    <>
      <div>
        <p className="rf-eyebrow !text-[var(--gray-mid)]">{detail.eyebrow}</p>
        <p
          className="mt-4 text-base font-semibold leading-snug"
          style={{ color: "var(--ink)", fontFamily: '"Bricolage Grotesque", sans-serif' }}
        >
          {detail.title}
        </p>
        <p
          className="mt-3 text-[13px] leading-relaxed"
          style={{ color: "var(--charcoal)", fontFamily: '"Hanken Grotesk", system-ui, sans-serif' }}
        >
          {detail.desc}
        </p>
      </div>
      <MarketingNavLink
        to={detail.cta.to}
        className="rf-mono mt-6 inline-flex items-center gap-1.5 text-[11px] transition-colors hover:text-[var(--sage)]"
        style={{ color: "var(--ink)" }}
        onNavigate={onNavigate}
      >
        {detail.cta.label}
        <ArrowRight size={14} strokeWidth={2.5} />
      </MarketingNavLink>
    </>
  );
}

export function NavMegaMenu({ menu }: { menu: NavMenu }) {
  const items = useMemo(() => allItems(menu), [menu]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const preview = activeLabel
    ? items.find((i) => i.label === activeLabel)?.detail ?? menu.intro
    : menu.intro;

  const isGrid = Boolean(menu.grid?.length);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setActiveLabel(null);
    }, 220);
  };

  const closeMenu = () => {
    clearCloseTimer();
    setOpen(false);
    setActiveLabel(null);
  };

  return (
    <div
      className={`relative ${menu.align === "right" ? "nav-drop-right" : ""}`}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        to={menu.to}
        className="rf-mono flex items-center gap-1.5 py-2 text-sm"
        style={{ color: "var(--white)" }}
      >
        {menu.label}
        <Plus
          size={13}
          strokeWidth={2.5}
          className="transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : undefined }}
        />
      </Link>

      <div
        className={`rf-nav-drop absolute top-full z-[60] transition-all duration-200 ${
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <div className="pt-2">
          <div
            className={`rf-nav-panel flex overflow-hidden border ${isGrid ? "w-[min(720px,calc(100vw-3rem))]" : "w-[min(560px,calc(100vw-3rem))]"}`}
            style={{ borderColor: "rgba(30,30,30,0.12)", background: "var(--white)" }}
          >
            <div
              className="flex w-[240px] shrink-0 flex-col justify-between p-6 md:w-[260px]"
              style={{ background: "var(--cream)" }}
            >
              <NavPreviewPanel detail={preview} onNavigate={closeMenu} />
            </div>

            <div className="min-w-0 flex-1 p-2">
              {menu.grid ? (
                <div className="grid sm:grid-cols-2">
                  {menu.grid.map((item) => (
                    <NavDropdownLink
                      key={item.label}
                      item={item}
                      active={activeLabel === item.label}
                      onHover={() => setActiveLabel(item.label)}
                      onNavigate={closeMenu}
                    />
                  ))}
                </div>
              ) : (
                menu.sections?.map((section) => (
                  <div key={section.title} className="px-2 py-2">
                    <p className="rf-eyebrow px-4 pb-1 pt-2 !text-[var(--gray-mid)]">{section.title}</p>
                    {section.items.map((item) => (
                      <NavDropdownLink
                        key={item.label}
                        item={item}
                        active={activeLabel === item.label}
                        onHover={() => setActiveLabel(item.label)}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
