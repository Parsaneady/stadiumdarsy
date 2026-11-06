import { Suspense, useEffect } from 'react';
import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun, LogOut, Archive, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { NAV, LEGACY_NAV } from './nav';
import { useUI } from './uiStore';
import { ErrorBoundary } from './ErrorBoundary';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

const PageSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="در حال بارگذاری">
    <Skeleton className="h-10 w-64 bg-muted" />
    <Skeleton className="h-48 w-full rounded-3xl bg-muted" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
  </div>
);

export default function ArenaLayout() {
  const { user, loading, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useUI();
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => { document.documentElement.dir = 'rtl'; }, []);

  if (loading) return <div className="arena min-h-screen grid place-items-center"><div className="w-10 h-10 rounded-full arena-gradient animate-pulse" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const name = profile?.display_name || profile?.first_name || 'قهرمان';

  return (
    <div className={cn('arena arena-grain min-h-screen', theme === 'light' && 'arena-light')}>
      {/* Desktop sidebar (right side in RTL) */}
      <aside className="hidden lg:flex fixed inset-y-0 right-0 w-64 flex-col p-4 z-30">
        <div className="arena-glass rounded-3xl h-full flex flex-col p-4">
          <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="w-11 h-11 rounded-2xl arena-gradient grid place-items-center arena-glow"><Trophy className="w-6 h-6 text-primary-foreground" aria-hidden /></span>
            <span><span className="font-display text-xl whitespace-nowrap block leading-none">استادیوم درسی</span><span className="text-xs text-muted-foreground">مربی هوشمند مطالعه</span></span>
          </Link>
          <nav aria-label="منوی اصلی" className="flex-1 space-y-1">
            {NAV.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/'}
                className={({ isActive }) => cn('relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60')}>
                {({ isActive }) => (<>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-2xl arena-gradient arena-glow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <Icon className="w-5 h-5 relative" aria-hidden /><span className="relative">{label}</span>
                </>)}
              </NavLink>
            ))}
          </nav>
          <LegacyMenu />
        </div>
      </aside>

      <div className="lg:pr-64 relative z-10">
        <header className="sticky top-0 z-20 px-4 lg:px-8 pt-4">
          <div className="arena-glass rounded-2xl flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2 lg:hidden"><span className="w-8 h-8 rounded-xl arena-gradient grid place-items-center"><Trophy className="w-4 h-4 text-primary-foreground" aria-hidden /></span><span className="font-display text-xl">استادیوم درسی</span></div>
            <p className="hidden lg:block text-sm text-muted-foreground">سلام <span className="text-foreground font-semibold">{name}</span>، آماده‌ی بازی امروزی؟</p>
            <div className="flex items-center gap-1">
              <div className="lg:hidden"><LegacyMenu compact /></div>
              <IconBtn label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'} onClick={toggleTheme}>{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</IconBtn>
              <IconBtn label="خروج از حساب" onClick={() => signOut()}><LogOut className="w-5 h-5 rtl:-scale-x-100" /></IconBtn>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <ErrorBoundary><Suspense fallback={<PageSkeleton />}><Outlet /></Suspense></ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav aria-label="منوی پایین" className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3">
        <div className="arena-glass rounded-3xl grid grid-cols-5 p-1.5">
          {NAV.filter((n) => n.mobile).map(({ path, short, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) => cn('relative flex flex-col items-center gap-0.5 py-2 min-h-[52px] rounded-2xl text-[11px] font-medium', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}>
              {({ isActive }) => (<>
                {isActive && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-2xl arena-gradient" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Icon className="w-5 h-5 relative" aria-hidden /><span className="relative">{short}</span>
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }} onClick={onClick} aria-label={label} title={label}
      className="w-11 h-11 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {children}
    </motion.button>
  );
}

function LegacyMenu({ compact }: { compact?: boolean }) {
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button aria-label="ابزارهای قبلی" className="w-11 h-11 grid place-items-center rounded-xl text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Archive className="w-5 h-5" /></button>
        ) : (
          <button className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-dashed border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Archive className="w-5 h-5" aria-hidden />ابزارهای قبلی
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>ابزارهای قبلی</DropdownMenuLabel>
        {LEGACY_NAV.map((l) => <DropdownMenuItem key={l.path} asChild><Link to={l.path}>{l.label}</Link></DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
