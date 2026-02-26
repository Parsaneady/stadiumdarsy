import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Moon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'sleep' | 'study' | 'break' | 'free_time';
  subject?: string;
  color?: string;
  startHour: number; // 0-24
  endHour: number; // 0-24
}

interface StudyMarker {
  hour: number;
  type: 'start' | 'end';
  subject?: string;
  color?: string;
}

interface DayClockCircleProps {
  activities: Activity[];
  wakeUpHour?: number;
  currentHour?: number;
  size?: number;
  subjectColors?: Record<string, string>;
  studyMarkers?: StudyMarker[];
  totalStudyMinutes?: number;
}

const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  'ریاضی': '#F97316',
  'فیزیک': '#3B82F6', 
  'شیمی': '#10B981',
  'زیست': '#8B5CF6',
  'ادبیات': '#EC4899',
  'عربی': '#EAB308',
  'زبان': '#06B6D4',
  'دینی': '#84CC16',
};

// Get Tehran time
const getTehranTime = () => {
  const now = new Date();
  const tehranOffset = 3.5 * 60; // Tehran is UTC+3:30
  const localOffset = now.getTimezoneOffset();
  const tehranTime = new Date(now.getTime() + (localOffset + tehranOffset) * 60000);
  return {
    hours: tehranTime.getHours(),
    minutes: tehranTime.getMinutes(),
    seconds: tehranTime.getSeconds(),
    totalHours: tehranTime.getHours() + tehranTime.getMinutes() / 60 + tehranTime.getSeconds() / 3600,
  };
};

// Convert hour to angle - 0 at top (12 o'clock position)
const hourToAngle = (hour: number) => {
  return (hour / 24) * 2 * Math.PI - Math.PI / 2;
};

export const DayClockCircle = ({ 
  activities, 
  wakeUpHour = 7, 
  currentHour,
  size = 280,
  subjectColors = {},
  studyMarkers = [],
  totalStudyMinutes = 0,
}: DayClockCircleProps) => {
  const radius = (size / 2) - 30;
  const center = size / 2;
  const innerRadius = radius - 35;
  
  // Tehran time state - update every second for smooth movement
  const [tehranTime, setTehranTime] = useState(getTehranTime());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTehranTime(getTehranTime());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);
  
  const now = currentHour ?? tehranTime.totalHours;
  
  const SUBJECT_COLORS = { ...DEFAULT_SUBJECT_COLORS, ...subjectColors };

  // Calculate arc path - 0 is at top
  const getArcPath = (startHour: number, endHour: number, innerR: number, outerR: number) => {
    const startAngle = hourToAngle(startHour);
    const endAngle = hourToAngle(endHour);
    
    const x1 = center + outerR * Math.cos(startAngle);
    const y1 = center + outerR * Math.sin(startAngle);
    const x2 = center + outerR * Math.cos(endAngle);
    const y2 = center + outerR * Math.sin(endAngle);
    const x3 = center + innerR * Math.cos(endAngle);
    const y3 = center + innerR * Math.sin(endAngle);
    const x4 = center + innerR * Math.cos(startAngle);
    const y4 = center + innerR * Math.sin(startAngle);
    
    const largeArc = (endHour - startHour) > 12 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Hour markers - 0 at top
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angle = hourToAngle(i);
      const isMainHour = i % 3 === 0;
      const markerLength = isMainHour ? 8 : 4;
      const textRadius = radius + 18;
      
      return {
        hour: i,
        x1: center + (radius - markerLength) * Math.cos(angle),
        y1: center + (radius - markerLength) * Math.sin(angle),
        x2: center + radius * Math.cos(angle),
        y2: center + radius * Math.sin(angle),
        textX: center + textRadius * Math.cos(angle),
        textY: center + textRadius * Math.sin(angle),
        isMain: isMainHour,
      };
    });
  }, [radius, center]);

  // Wake-up line with arrow
  const wakeUpAngle = hourToAngle(wakeUpHour);
  const wakeUpX1 = center + innerRadius * Math.cos(wakeUpAngle);
  const wakeUpY1 = center + innerRadius * Math.sin(wakeUpAngle);
  const wakeUpX2 = center + (radius + 25) * Math.cos(wakeUpAngle);
  const wakeUpY2 = center + (radius + 25) * Math.sin(wakeUpAngle);
  
  // Arrow head points for wake-up
  const arrowLength = 8;
  const arrowAngleOffset = Math.PI / 6;
  const wakeArrow1X = wakeUpX2 - arrowLength * Math.cos(wakeUpAngle - arrowAngleOffset);
  const wakeArrow1Y = wakeUpY2 - arrowLength * Math.sin(wakeUpAngle - arrowAngleOffset);
  const wakeArrow2X = wakeUpX2 - arrowLength * Math.cos(wakeUpAngle + arrowAngleOffset);
  const wakeArrow2Y = wakeUpY2 - arrowLength * Math.sin(wakeUpAngle + arrowAngleOffset);

  const getActivityColor = (activity: Activity) => {
    if (activity.type === 'sleep') return 'hsl(var(--muted))';
    if (activity.type === 'break') return 'hsl(var(--muted) / 0.5)';
    if (activity.color) return activity.color;
    if (activity.subject && SUBJECT_COLORS[activity.subject]) {
      return SUBJECT_COLORS[activity.subject];
    }
    return 'hsl(var(--primary))';
  };

  // Current time indicator - smooth movement
  const currentAngle = hourToAngle(now);
  const currentX = center + (radius - 10) * Math.cos(currentAngle);
  const currentY = center + (radius - 10) * Math.sin(currentAngle);

  // Format wake-up time as HH:MM
  const wakeUpHours = Math.floor(wakeUpHour);
  const wakeUpMinutes = Math.round((wakeUpHour % 1) * 60);
  const wakeUpTimeStr = `${String(wakeUpHours).padStart(2, '0')}:${String(wakeUpMinutes).padStart(2, '0')}`;

  // Format study time
  const studyHours = Math.floor(totalStudyMinutes / 60);
  const studyMins = Math.round(totalStudyMinutes % 60);
  const studyTimeStr = `${String(studyHours).padStart(2, '0')}:${String(studyMins).padStart(2, '0')}`;

  // Legend items
  const legendItems = useMemo(() => {
    const items: { label: string; color: string; hoursFormatted: string }[] = [];
    const subjectMinutes: Record<string, number> = {};
    
    activities.forEach(act => {
      if (act.type === 'study' && act.subject) {
        const durationMins = (act.endHour - act.startHour) * 60;
        subjectMinutes[act.subject] = (subjectMinutes[act.subject] || 0) + durationMins;
      }
    });
    
    Object.entries(subjectMinutes).forEach(([subject, mins]) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      items.push({
        label: subject,
        color: SUBJECT_COLORS[subject] || 'hsl(var(--primary))',
        hoursFormatted: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      });
    });
    
    return items;
  }, [activities]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size + 40} className="drop-shadow-lg">
        {/* Main circle group - shifted down for wake-up label */}
        <g transform={`translate(0, 20)`}>
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
                  isMain ? 'stroke-[2]' : 'stroke-[1] opacity-40'
                )}
              />
              {isMain && (
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-[11px] font-bold"
                >
                  {hour}
                </text>
              )}
            </g>
          ))}

          {/* Study start/end markers - use subject color */}
          {studyMarkers.map((marker, idx) => {
            const markerAngle = hourToAngle(marker.hour);
            const mx1 = center + innerRadius * Math.cos(markerAngle);
            const my1 = center + innerRadius * Math.sin(markerAngle);
            const mx2 = center + (radius + 10) * Math.cos(markerAngle);
            const my2 = center + (radius + 10) * Math.sin(markerAngle);
            
            // Get subject color
            const markerColor = marker.color || (marker.subject && SUBJECT_COLORS[marker.subject]) || 'hsl(var(--primary))';
            
            return (
              <line
                key={`marker-${idx}`}
                x1={mx1}
                y1={my1}
                x2={mx2}
                y2={my2}
                stroke={markerColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Wake-up indicator with arrow and time label */}
          <line
            x1={wakeUpX1}
            y1={wakeUpY1}
            x2={wakeUpX2}
            y2={wakeUpY2}
            className="stroke-warning stroke-[3]"
            strokeLinecap="round"
          />
          {/* Arrow head */}
          <path
            d={`M ${wakeUpX2} ${wakeUpY2} L ${wakeArrow1X} ${wakeArrow1Y} M ${wakeUpX2} ${wakeUpY2} L ${wakeArrow2X} ${wakeArrow2Y}`}
            className="stroke-warning stroke-[3]"
            strokeLinecap="round"
            fill="none"
          />
          {/* Wake-up time label */}
          <text
            x={center + (radius + 40) * Math.cos(wakeUpAngle)}
            y={center + (radius + 40) * Math.sin(wakeUpAngle)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-warning text-[10px] font-bold"
          >
            {wakeUpTimeStr}
          </text>

          {/* Current time indicator - moving hand */}
          <line
            x1={center}
            y1={center}
            x2={currentX}
            y2={currentY}
            className="stroke-primary stroke-2"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r={6}
            className="fill-primary"
          />
          <circle
            cx={center}
            cy={center}
            r={4}
            className="fill-primary"
          />

          {/* Night owl indicator */}
          {tehranTime.hours < 3 && (
            <g>
              <text
                x={center}
                y={center - 28}
                textAnchor="middle"
                className="fill-accent text-[10px]"
              >
                🌙 شب‌زنده‌داری
              </text>
            </g>
          )}

          {/* Center text - Study time HH:MM */}
          <text
            x={center}
            y={tehranTime.hours < 3 ? center - 5 : center - 10}
            textAnchor="middle"
            className="fill-foreground text-lg font-bold font-mono"
          >
            {studyTimeStr}
          </text>
          <text
            x={center}
            y={tehranTime.hours < 3 ? center + 17 : center + 12}
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            ساعت مطالعه
          </text>
        </g>
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
              <span className="text-xs text-muted-foreground font-mono">
                {item.hoursFormatted}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
