import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export const StatCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }: StatCardProps) => {
  return (
    <GlassCard delay={delay} className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3
            className="text-3xl font-bold"
            style={{ color }}
          >
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div
        className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />
    </GlassCard>
  );
};
