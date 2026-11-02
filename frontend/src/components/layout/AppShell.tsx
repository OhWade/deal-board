import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import styles from "./AppShell.module.css";

export interface FlashState {
  flash?: string;
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  // Pages pass a one-time message through navigation state after a save or delete
  const flash = (location.state as FlashState | null)?.flash;

  // New page starts at the top, so a flash message is always in view
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Clear it after a few seconds so it doesn't come back on refresh
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(
      () => navigate(location.pathname + location.search, { replace: true, state: null }),
      4000,
    );
    return () => clearTimeout(timer);
  }, [flash, navigate, location.pathname, location.search]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.brand}>
            <svg viewBox="0 0 32 32" aria-hidden="true" className={styles.mark}>
              <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M9 8v16M13 8v16M17 8v16M21 8v16" />
                <path d="M6 21 25 11" />
              </g>
            </svg>
            Deal Board
          </Link>
          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : undefined)}>
              Dashboard
            </NavLink>
            <NavLink
              to="/deals"
              end
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              Deals
            </NavLink>
          </nav>
          <Link to="/deals/new" className={`btn btn-primary ${styles.cta}`}>
            Log a deal
          </Link>
        </div>
      </header>

      <div role="status" aria-live="polite" className={styles.flashRegion}>
        {flash && <p className={styles.flash}>{flash}</p>}
      </div>

      <main>
        <Outlet />
      </main>
    </>
  );
}
