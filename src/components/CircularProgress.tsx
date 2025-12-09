import { memo, useMemo } from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export const CircularProgress = memo(({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'hsl(var(--primary))',
  label,
  showValue = true,
}: CircularProgressProps) => {
  const { radius, circumference, offset } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    const c = r * 2 * Math.PI;
    const o = c - (value / 100) * c;
    return { radius: r, circumference: c, offset: o };
  }, [size, strokeWidth, value]);

  const filterStyle = useMemo(() => ({
    filter: `drop-shadow(0 0 10px ${color})`,
  }), [color]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out will-change-[stroke-dashoffset]"
          style={filterStyle}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {showValue && (
          <span className="text-2xl font-bold text-foreground">
            {Math.round(value)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground mt-1">{label}</span>
        )}
      </div>
    </div>
  );
});

CircularProgress.displayName = 'CircularProgress';
