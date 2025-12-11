import { memo, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { formatHoursShort, formatHoursDisplay } from '@/lib/timeUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  weeklyChartData: any[];
  subjectData: any[];
  todayPercent: number;
  todayPlan: any;
  todayCompleted: number;
  todayTotal: number;
  todayActualHours: number;
}

// Custom tooltip formatter
const formatChartTooltip = (value: number, name: string) => {
  if (name === 'ساعت' || name === 'هدف') {
    return [formatHoursShort(value), name];
  }
  return [value, name];
};

const tooltipStyle = {
  backgroundColor: 'hsl(230, 20%, 12%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
};

const DashboardCharts = memo(({ 
  weeklyChartData, 
  subjectData, 
  todayPercent, 
  todayPlan,
  todayCompleted,
  todayTotal,
  todayActualHours
}: DashboardChartsProps) => {
  return (
    <>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <GlassCard className="lg:col-span-2" delay={0.4}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">نمودار هفتگی</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">ساعت</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-muted-foreground">هدف</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyChartData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250, 85%, 65%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(250, 85%, 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={formatChartTooltip}
                />
                <Area
                  type="monotone"
                  dataKey="ساعت"
                  stroke="hsl(250, 85%, 65%)"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="هدف"
                  stroke="hsl(200, 80%, 55%)"
                  fillOpacity={1}
                  fill="url(#colorTarget)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Today's Progress */}
        <GlassCard delay={0.5}>
          <h3 className="text-lg font-semibold mb-6">پیشرفت امروز</h3>
          <div className="flex flex-col items-center">
            <CircularProgress
              value={todayPercent}
              size={140}
              strokeWidth={10}
              color="hsl(250, 85%, 65%)"
              label={todayPlan?.dayName}
            />
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground">جلسات تکمیل شده</span>
                <span className="font-semibold">{todayCompleted} از {todayTotal}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground">ساعت مطالعه</span>
                <span className="font-semibold">
                  {formatHoursDisplay(todayActualHours)}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Subject Performance - Study Hours */}
      {subjectData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard delay={0.6}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">ساعت مطالعه به تفکیک درس</h3>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div className="space-y-3">
              {subjectData.map((subject, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-28 text-right truncate" title={subject.name}>
                    {subject.name}
                  </span>
                  <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                      style={{ width: `${Math.max(5, (subject['ساعت'] / Math.max(...subjectData.map(s => s['ساعت']), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-left">{formatHoursShort(subject['ساعت'])}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Subject Performance - Test Count */}
          <GlassCard delay={0.7}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">تست‌زنی به تفکیک درس</h3>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              {subjectData.map((subject, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-28 text-right truncate" title={subject.name}>
                    {subject.name}
                  </span>
                  <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all"
                      style={{ width: `${Math.max(5, (subject['تست'] / Math.max(...subjectData.map(s => s['تست']), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-left">{subject['تست']} تست</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
});

DashboardCharts.displayName = 'DashboardCharts';

export default DashboardCharts;
