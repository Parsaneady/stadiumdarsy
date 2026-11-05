import { motion, useReducedMotion, animate } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fa } from '@/lib/arena/format';

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <p className="text-xs font-bold tracking-wider text-primary mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl leading-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, children, glow }: { className?: string; children: ReactNode; glow?: boolean }) {
  return <section className={cn('arena-glass rounded-3xl p-5 md:p-6', glow && 'arena-glow', className)}>{children}</section>;
}

export function EmptyState({ icon: Icon, title, text, to, cta }: { icon: LucideIcon; title: string; text: string; to?: string; cta?: string }) {
  return (
    <div className="text-center py-12 px-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="w-16 h-16 mx-auto rounded-2xl arena-gradient grid place-items-center arena-glow mb-4">
        <Icon className="w-8 h-8 text-primary-foreground" aria-hidden />
      </motion.div>
      <h3 className="font-display text-2xl mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-5">{text}</p>
      {to && cta && <ArenaLink to={to}>{cta}</ArenaLink>}
    </div>
  );
}

export function ArenaLink({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'ghost' }) {
  return (
    <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="inline-block">
      <Link to={to} className={cn('inline-flex items-center gap-2 min-h-[44px] px-5 rounded-2xl font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'primary' ? 'arena-gradient text-primary-foreground arena-glow' : 'border border-border hover:bg-muted/60')}>
        {children}
      </Link>
    </motion.span>
  );
}

export function Counter({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setV(value); return; }
    const c = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [value, reduce]);
  return <span className={className}>{fa(v.toFixed(decimals))}</span>;
}

export function ProgressRing({ value, size = 120, stroke = 10, label, warm }: { value: number; size?: number; stroke?: number; label?: string; warm?: boolean }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const id = `ring-${warm ? 'w' : 'c'}-${size}`;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'پیشرفت'}: ${fa(Math.round(pct))} درصد`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" x2="1">
            <stop offset="0%" stopColor={warm ? 'hsl(32 98% 58%)' : 'hsl(158 84% 45%)'} />
            <stop offset="100%" stopColor={warm ? 'hsl(352 88% 60%)' : 'hsl(189 94% 48%)'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: reduce ? c - (pct / 100) * c : c }} animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute text-center">
        <Counter value={pct} className="font-display text-3xl block leading-none" />
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

export function StatTile({ icon: Icon, label, value, suffix, warm }: { icon: LucideIcon; label: string; value: number; suffix?: string; warm?: boolean }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="arena-glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('w-8 h-8 rounded-xl grid place-items-center', warm ? 'arena-warm' : 'arena-gradient')}><Icon className="w-4 h-4 text-primary-foreground" aria-hidden /></span>
      </div>
      <p className="font-display text-4xl leading-none"><Counter value={value} />{suffix && <span className="text-base text-muted-foreground font-sans mr-1">{suffix}</span>}</p>
    </motion.div>
  );
}
