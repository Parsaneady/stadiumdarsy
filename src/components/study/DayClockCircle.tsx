import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'sleep' | 'study' | 'break' | 'free_time';
  subject?: string;
  color?: string;
  startHour: number; // 0-24
  endHour: number; // 0-24
}

interface DayClockCircleProps {
  activities: Activity[];
  wakeUpHour?: number;
  currentHour?: number;
  size?: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  'ریاضی': '#F97316',
  'فیزیک': '#3B82F6', 
  'شیمی': '#10B981',
  'زیست': '#8B5CF6',
  'ادبیات': '#EC4899',
  'عربی': '#EAB308',
  'زبان': '#06B6D4',
  'دینی': '#84CC16',
};

export const DayClockCircle = ({ 
  activities, 
  wakeUpHour = 7, 
  currentHour,
  size = 280 
}: DayClockCircleProps) => {
  const radius = (size / 2) - 20;
  const center = size / 2;
  const innerRadius = radius - 35;
  
  // Get current hour if not provided
  const now = currentHour ?? new Date().getHours();

  // Calculate arc path for a segment
  const getArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    // Convert hours to angles (0 hours = top, clockwise)
    const startRad = ((startAngle - 6) / 24) * 2 * Math.PI;
    const endRad = ((endAngle - 6) / 24) * 2 * Math.PI;
    
    const x1 = center + outerR * Math.sin(startRad);
    const y1 = center - outerR * Math.cos(startRad);
    const x2 = center + outerR * Math.sin(endRad);
    const y2 = center - outerR * Math.cos(endRad);
    const x3 = center + innerR * Math.sin(endRad);
    const y3 = center - innerR * Math.cos(endRad);
    const x4 = center + innerR * Math.sin(startRad);
    const y4 = center - innerR * Math.cos(startRad);
    
    const largeArc = (endAngle - startAngle) > 12 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angle = ((i - 6) / 24) * 2 * Math.PI;
      const isMainHour = i % 6 === 0;
      const markerRadius = radius + (isMainHour ? 8 : 4);
      const textRadius = radius + 16;
      
      return {
        hour: i,
        x1: center + (radius - 5) * Math.sin(angle),
        y1: center - (radius - 5) * Math.cos(angle),
        x2: center + markerRadius * Math.sin(angle),
        y2: center - markerRadius * Math.cos(angle),
        textX: center + textRadius * Math.sin(angle),
        textY: center - textRadius * Math.cos(angle),
        isMain: isMainHour,
      };
    });
  }, [radius, center]);

  // Get color for activity
  const getActivityColor = (activity: Activity) => {
    if (activity.type === 'sleep') return 'hsl(var(--muted))';
    if (activity.type === 'break') return 'hsl(var(--muted) / 0.5)';
    if (activity.color) return activity.color;
    if (activity.subject && SUBJECT_COLORS[activity.subject]) {
      return SUBJECT_COLORS[activity.subject];
    }
    return 'hsl(var(--primary))';
  };

  // Current time indicator angle
  const currentAngle = ((now - 6) / 24) * 2 * Math.PI;
  const currentX = center + (radius - 15) * Math.sin(currentAngle);
  const currentY = center - (radius - 15) * Math.cos(currentAngle);

  // Legend items
  const legendItems = useMemo(() => {
    const items: { label: string; color: string; hours: number }[] = [];
    const subjectHours: Record<string, number> = {};
    
    activities.forEach(act => {
      if (act.type === 'study' && act.subject) {
        const duration = act.endHour - act.startHour;
        subjectHours[act.subject] = (subjectHours[act.subject] || 0) + duration;
      }
    });
    
    Object.entries(subjectHours).forEach(([subject, hours]) => {
      items.push({
        label: subject,
        color: SUBJECT_COLORS[subject] || 'hsl(var(--primary))',
        hours,
      });
    });
    
    return items;
  }, [activities]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="fill-muted/20 stroke-muted/30"
          strokeWidth="2"
        />
        
        {/* Inner circle */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          className="fill-background/80"
        />

        {/* Sleep segment (0 to wakeUpHour) */}
        <path
          d={getArcPath(0, wakeUpHour, innerRadius, radius)}
          fill="hsl(var(--muted))"
          className="opacity-60"
        />

        {/* Activity segments */}
        {activities.map((activity) => (
          <path
            key={activity.id}
            d={getArcPath(activity.startHour, activity.endHour, innerRadius, radius)}
            fill={getActivityColor(activity)}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}

        {/* Hour markers */}
        {hourMarkers.map(({ hour, x1, y1, x2, y2, textX, textY, isMain }) => (
          <g key={hour}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={cn(
                'stroke-muted-foreground',
                isMain ? 'stroke-[2]' : 'stroke-[1] opacity-50'
              )}
            />
            {isMain && (
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {hour}
              </text>
            )}
          </g>
        ))}

        {/* Current time indicator */}
        <circle
          cx={currentX}
          cy={currentY}
          r={6}
          className="fill-primary animate-pulse"
        />
        <line
          x1={center}
          y1={center}
          x2={currentX}
          y2={currentY}
          className="stroke-primary stroke-2"
        />

        {/* Center text */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
        >
          {now}:00
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          ساعت فعلی
        </text>
      </svg>

      {/* Legend */}
      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {legendItems.map((item) => (
            <div 
              key={item.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.hours.toFixed(1)} ساعت
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};