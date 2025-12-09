import { cn } from '@/lib/utils';
import { ReactNode, memo } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const GlassCard = memo(({ children, className, hover = true, delay = 0 }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 transition-transform duration-200 animate-fade-in',
        hover && 'hover:scale-[1.01] hover:-translate-y-1',
        className
      )}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';
