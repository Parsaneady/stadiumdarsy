import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const GlassCard = ({ children, className, hover = true, delay = 0 }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 transition-all duration-200 animate-fade-in',
        hover && 'hover:scale-[1.01] hover:-translate-y-1',
        className
      )}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      {children}
    </div>
  );
};
