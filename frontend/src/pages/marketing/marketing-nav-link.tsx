import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type MarketingNavLinkProps = {
  to: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  /** Called after navigation starts (e.g. close mega-menu). */
  onNavigate?: () => void;
};

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollPageTop(smooth = false) {
  window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" });
}

/** In-app marketing link — reliable routing + hash scroll. */
export function MarketingNavLink({
  to,
  className,
  style,
  children,
  onMouseEnter,
  onFocus,
  onNavigate,
}: MarketingNavLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const hashIdx = to.indexOf("#");
  const path = hashIdx === -1 ? to : to.slice(0, hashIdx) || "/";
  const hash = hashIdx === -1 ? "" : `#${to.slice(hashIdx + 1)}`;
  const href = hash ? `${path}${hash}` : path;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigate?.();

    if (!hash) {
      if (location.pathname === path) {
        scrollPageTop(true);
        return;
      }
      navigate(path);
      scrollPageTop(false);
      return;
    }

    if (location.pathname === path) {
      navigate({ pathname: path, hash }, { replace: false });
      window.requestAnimationFrame(() => scrollToHash(hash));
      return;
    }
    navigate({ pathname: path, hash });
  };

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      {children}
    </a>
  );
}

/** Scroll to hash (or top) after marketing route changes. */
export function useMarketingHashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const t = window.setTimeout(() => scrollToHash(location.hash), 180);
      return () => window.clearTimeout(t);
    }
    scrollPageTop(false);
  }, [location.pathname, location.hash]);
}
