import { useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { BarChart3, Award, Clock, FileText, Target, BookOpen } from 'lucide-react';
import { useStudyStore, DailyLog } from '@/stores/studyStore';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { formatHoursShort, formatHoursDisplay } from '@/lib/timeUtils';
import { AppLayout } from '@/components/AppLayout';

// Lazy load chart components
const LazyAnalyticsCharts = lazy(() => import('@/components/AnalyticsCharts'));

const ChartSkeleton = () => (
  <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
);

const COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#a855f7', '#3b82f6', '#84cc16', '#f43f5e', '#22d3d8',
  '#facc15', '#fb7185', '#34d399', '#818cf8', '#fbbf24', '#c084fc'
];

// Memoized stat card component
const QuickStat = memo(({ icon: Icon, label, value, unit, color }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  unit: string; 
  color: string 
}) => (
  <GlassCard delay={0} className="text-center">
    <Icon className="w-8 h-8 mx-auto mb-2" style={{ color }} />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label} {unit}</p>
  </GlassCard>
));

QuickStat.displayName = 'QuickStat';

// Calculate stats from daily logs (historical data from database)
const calculateStatsFromLogs = (dailyLogs: DailyLog[]) => {
  const subjectStats: Record<string, { hours: number; tests: number; sessions: number }> = {};
  let totalHours = 0;
  let totalTests = 0;
  let totalCompletion = 0;
  let sessionCount = 0;

  dailyLogs.forEach(log => {
    if (log.sessions) {
      log.sessions.forEach(session => {
        totalHours += session.actualHours || 0;
        totalTests += session.actualTests || 0;
        sessionCount++;

        // Calculate completion for this session
        const hoursProgress = session.targetHours > 0 ? (session.actualHours / session.targetHours) * 100 : 0;
        const testsProgress = session.targetTests > 0 ? (session.actualTests / session.targetTests) * 100 : 0;
        totalCompletion += (hoursProgress + testsProgress) / 2;

        if (!subjectStats[session.subject]) {
          subjectStats[session.subject] = { hours: 0, tests: 0, sessions: 0 };
        }
        subjectStats[session.subject].hours += session.actualHours || 0;
        subjectStats[session.subject].tests += session.actualTests || 0;
        subjectStats[session.subject].sessions++;
      });
    }
  });

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalTests,
    avgCompletion: sessionCount > 0 ? Math.round((totalCompletion / sessionCount) * 100) / 100 : 0,
    subjectStats,
  };
};

const Analytics = () => {
  const { weeklyPlan, dailyLogs, initializeWeek } = useStudyStore();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  // Calculate stats from daily logs instead of weekly plan
  const stats = useMemo(() => calculateStatsFromLogs(dailyLogs), [dailyLogs]);

  // Memoize all chart data - use daily logs for historical data
  const chartData = useMemo(() => {
    // Group daily logs by day of week for weekly progress
    const PERSIAN_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    
    // Get last 7 days of logs
    const last7Days = dailyLogs.slice(0, 7);
    
    const weeklyProgressData = PERSIAN_DAYS.map((dayName, dayIndex) => {
      // Find today's data for this day from current week plan
      const dayPlan = weeklyPlan.find(d => d.dayIndex === dayIndex);
      const actual = dayPlan?.sessions.reduce((sum, s) => sum + (s.actualHours || 0), 0) || 0;
      const target = dayPlan?.sessions.reduce((sum, s) => sum + s.targetHours, 0) || 0;
      
      return {
        name: dayName,
        عملکرد: actual,
        هدف: target,
        درصد: target > 0 ? Math.round((actual / target) * 100) : 0,
      };
    });

    const subjectDistribution = Object.entries(stats.subjectStats).map(([name, data], index) => ({
      name,
      value: data.hours,
      color: COLORS[index % COLORS.length],
    }));

    const subjectRadarData = Object.entries(stats.subjectStats).map(([name, data]) => ({
      subject: name,
      ساعت: data.hours,
      تست: data.tests / 10,
    }));

    const completionByDay = weeklyPlan.map(day => {
      const completed = day.sessions.filter(s => s.completed).length;
      const total = day.sessions.length;
      return {
        name: day.dayName,
        تکمیل: completed,
        باقیمانده: total - completed,
      };
    });

    const subjectRankings = Object.entries(stats.subjectStats)
      .sort((a, b) => b[1].hours - a[1].hours)
      .map(([name, data], index) => ({
        rank: index + 1,
        name,
        hours: data.hours,
        tests: data.tests,
        color: COLORS[index % COLORS.length],
      }));

    return {
      weeklyProgressData,
      subjectDistribution,
      subjectRadarData,
      completionByDay,
      subjectRankings,
    };
  }, [weeklyPlan, dailyLogs, stats.subjectStats]);

  const quickStats = useMemo(() => [
    { icon: Clock, label: 'کل ساعات', value: formatHoursShort(stats.totalHours), unit: '', color: '#06b6d4' },
    { icon: FileText, label: 'کل تست‌ها', value: stats.totalTests, unit: 'تست', color: '#8b5cf6' },
    { icon: Target, label: 'میانگین تکمیل', value: `${stats.avgCompletion.toFixed(0)}%`, unit: '', color: '#10b981' },
    { icon: BookOpen, label: 'تعداد درس‌ها', value: Object.keys(stats.subjectStats).length, unit: '', color: '#f59e0b' },
  ], [stats]);

  return (
    <AppLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">تحلیل‌ها</h1>
          <p className="text-muted-foreground mt-1">تحلیل جامع عملکرد مطالعه</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <QuickStat key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts - Lazy loaded */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      }>
        <LazyAnalyticsCharts 
          weeklyProgressData={chartData.weeklyProgressData}
          subjectDistribution={chartData.subjectDistribution}
          subjectRadarData={chartData.subjectRadarData}
          completionByDay={chartData.completionByDay}
          subjectRankings={chartData.subjectRankings}
          totalHours={stats.totalHours}
        />
      </Suspense>
    </div>
    </AppLayout>
  );
};

export default Analytics;
