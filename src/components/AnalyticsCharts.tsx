import { memo } from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { formatHoursShort, formatHoursDisplay } from '@/lib/timeUtils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';

interface AnalyticsChartsProps {
  weeklyProgressData: any[];
  subjectDistribution: any[];
  subjectRadarData: any[];
  completionByDay: any[];
  subjectRankings: any[];
  totalHours: number;
}

const tooltipStyle = {
  backgroundColor: 'hsl(230, 20%, 12%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  direction: 'rtl' as const,
};

const tooltipTextStyle = {
  color: 'hsl(210, 40%, 98%)',
};

const AnalyticsCharts = memo(({ 
  weeklyProgressData,
  subjectDistribution,
  subjectRadarData,
  completionByDay,
  subjectRankings,
  totalHours,
}: AnalyticsChartsProps) => {
  return (
    <>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Area Chart */}
        <GlassCard delay={0.2}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            روند هفتگی
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgressData}>
                <defs>
                  <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(value) => formatHoursShort(value)} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [formatHoursShort(value), name]}
                />
                <Area type="monotone" dataKey="هدف" stroke="#06b6d4" fill="url(#gradientTarget)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="عملکرد" stroke="#8b5cf6" fill="url(#gradientActual)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Subject Distribution Pie Chart */}
        <GlassCard delay={0.3}>
          <h3 className="text-lg font-semibold mb-4">توزیع زمان بر دروس</h3>
          <div className="h-64 flex items-center justify-center">
            {subjectDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipTextStyle}
                    labelStyle={tooltipTextStyle}
                    formatter={(value: number) => [formatHoursShort(value), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">داده‌ای موجود نیست</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {subjectDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium" style={{ color: item.color }}>{item.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Subject Radar Chart */}
        <GlassCard delay={0.4}>
          <h3 className="text-lg font-semibold mb-4">مقایسه دروس</h3>
          <div className="h-64">
            {subjectRadarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={subjectRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Radar name="ساعت" dataKey="ساعت" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} isAnimationActive={false} />
                  <Radar name="تست" dataKey="تست" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} isAnimationActive={false} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">داده‌ای موجود نیست</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Completion by Day Bar Chart */}
        <GlassCard delay={0.5}>
          <h3 className="text-lg font-semibold mb-4">وضعیت تکمیل روزانه</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="تکمیل" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="باقیمانده" stackId="a" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Subject Rankings */}
      <GlassCard delay={0.6}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-warning" />
          رتبه‌بندی دروس
        </h3>
        <div className="space-y-3">
          {subjectRankings.map((subject) => (
            <div
              key={subject.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: subject.color }}
              >
                {subject.rank}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{subject.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatHoursDisplay(subject.hours)} • {subject.tests} تست
                </p>
              </div>
              <CircularProgress
                value={Math.min(100, (subject.hours / (totalHours || 1)) * 100)}
                size={50}
                strokeWidth={4}
                color={subject.color}
                showValue={false}
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
});

AnalyticsCharts.displayName = 'AnalyticsCharts';

export default AnalyticsCharts;
