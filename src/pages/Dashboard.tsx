import { useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { Clock, FileText, Target, TrendingUp, Flame, Award, Plus, CheckCircle2, Sparkles, Star, CalendarDays, StickyNote } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { StatCard } from '@/components/StatCard';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatHoursDisplay, formatHoursShort } from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';
import { getTodayQuote } from '@/lib/quotes';
import { cn } from '@/lib/utils';

// Lazy load charts
const LazyCharts = lazy(() => import('@/components/DashboardCharts'));

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
);

// Memoized session item component
const SessionItem = memo(({ 
  session, 
  todayPlanId,
  toggleComplete 
}: { 
  session: any; 
  todayPlanId: string;
  toggleComplete: (dayId: string, sessionId: string) => void;
}) => {
  const hoursPercent = session.targetHours > 0 
    ? Math.min(100, (session.actualHours / session.targetHours) * 100) 
    : 0;

  const performance = useMemo(() => {
    if (session.targetHours === 0) return { color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'بدون هدف' };
    const percent = (session.actualHours / session.targetHours) * 100;
    if (percent >= 100) return { color: 'text-success', bg: 'status-excellent', label: '✓ عالی' };
    if (percent >= 70) return { color: 'text-warning', bg: 'status-good', label: 'خوب' };
    return { color: 'text-destructive', bg: 'status-needs-work', label: 'نیاز به تلاش بیشتر' };
  }, [session.actualHours, session.targetHours]);

  const handleToggle = useCallback(() => {
    toggleComplete(todayPlanId, session.id);
  }, [toggleComplete, todayPlanId, session.id]);

  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        session.completed 
          ? 'bg-success/10 border-success/30' 
          : 'bg-muted/20 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              session.completed 
                ? 'bg-success border-success text-white' 
                : 'border-muted-foreground hover:border-primary'
            }`}
          >
            {session.completed && <CheckCircle2 className="w-4 h-4" />}
          </button>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: session.color }}
          />
          <span className={`font-medium ${session.completed ? 'line-through text-muted-foreground' : ''}`}>
            {session.subject}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${performance.bg}`}>
          {performance.label}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">ساعت</span>
            <span>{formatHoursShort(session.actualHours)} / {formatHoursShort(session.targetHours)}</span>
          </div>
          <Progress value={hoursPercent} className="h-1.5" indicatorClassName="bg-secondary" />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">تست</span>
            <span>{session.actualTests} / {session.targetTests}</span>
          </div>
          <Progress 
            value={session.targetTests > 0 ? Math.min(100, (session.actualTests / session.targetTests) * 100) : 0} 
            className="h-1.5" 
            indicatorClassName="bg-accent" 
          />
        </div>
      </div>
      
      {/* Notes Section */}
      {session.notes && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded-lg">
            <StickyNote className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
            <p className="text-xs leading-relaxed">{session.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

const Dashboard = () => {
  const { weeklyPlan, initializeWeek, getStats, streak, getTodayIndex, toggleSessionComplete, getUpcomingEvents, checkAndResetWeekly } = useStudyStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we need to reset weekly data (every Saturday)
    checkAndResetWeekly();
    
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek, checkAndResetWeekly]);

  const todayQuote = useMemo(() => getTodayQuote(), []);
  const stats = useMemo(() => getStats(), [getStats, weeklyPlan]);
  const upcomingEvents = useMemo(() => getUpcomingEvents(), [getUpcomingEvents]);
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];

  // Memoize today's calculations
  const { todayCompleted, todayTotal, todayPercent, todayActualHours, todayTargetHours } = useMemo(() => {
    const completed = todayPlan?.sessions.filter(s => s.completed).length || 0;
    const total = todayPlan?.sessions.length || 0;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    const actualHours = todayPlan?.sessions.reduce((sum, s) => sum + s.actualHours, 0) || 0;
    const targetHours = todayPlan?.sessions.reduce((sum, s) => sum + s.targetHours, 0) || 0;
    return { 
      todayCompleted: completed, 
      todayTotal: total, 
      todayPercent: percent,
      todayActualHours: actualHours,
      todayTargetHours: targetHours
    };
  }, [todayPlan]);

  // Memoize chart data
  const { weeklyChartData, subjectData } = useMemo(() => {
    const weeklyData = weeklyPlan.map(day => ({
      name: day.dayName,
      ساعت: day.sessions.reduce((sum, s) => sum + s.actualHours, 0),
      تست: day.sessions.reduce((sum, s) => sum + s.actualTests, 0),
      هدف: day.sessions.reduce((sum, s) => sum + s.targetHours, 0),
    }));

    const subjectData = Object.entries(stats.subjectStats).map(([subject, data]) => ({
      name: subject,
      ساعت: data.hours,
      تست: data.tests,
    }));

    return { weeklyChartData: weeklyData, subjectData };
  }, [weeklyPlan, stats.subjectStats]);

  const weeklyScore = useMemo(() => {
    if (stats.avgCompletion >= 90) return 'A+';
    if (stats.avgCompletion >= 80) return 'A';
    if (stats.avgCompletion >= 70) return 'B+';
    if (stats.avgCompletion >= 60) return 'B';
    if (stats.avgCompletion >= 50) return 'C';
    return 'D';
  }, [stats.avgCompletion]);

  const navigateToWeeklyPlan = useCallback(() => navigate('/weekly-plan'), [navigate]);
  const navigateToDailyLog = useCallback(() => navigate('/daily-log'), [navigate]);
  const navigateToHistory = useCallback(() => navigate('/history'), [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">داشبورد</h1>
          <p className="text-muted-foreground mt-1">خلاصه عملکرد این هفته</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
          <Flame className="w-5 h-5 text-warning" />
          <span className="font-medium">{streak} روز متوالی</span>
        </div>
      </div>

      {/* Daily Motivation */}
      <GlassCard className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20" delay={0.1}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-primary">انگیزه امروز</h3>
            <p className="text-lg leading-relaxed">«{todayQuote.quote}»</p>
            <p className="text-sm text-muted-foreground mt-2">— {todayQuote.author}</p>
          </div>
        </div>
      </GlassCard>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <GlassCard className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-400/20" delay={0.15}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              رویدادهای پیش رو
            </h3>
            <Button variant="ghost" size="sm" onClick={navigateToHistory} className="text-amber-400 hover:text-amber-300">
              <CalendarDays className="w-4 h-4 ml-1" />
              تقویم
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {upcomingEvents.slice(0, 5).map(({ event, daysRemaining }) => (
              <div 
                key={event.id}
                className={cn(
                  "px-4 py-3 rounded-xl border transition-all",
                  "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
                  "border-amber-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
                  daysRemaining <= 3 && "animate-pulse"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-lg",
                    daysRemaining === 0 ? "bg-destructive/20 text-destructive" :
                    daysRemaining <= 3 ? "bg-warning/20 text-warning" :
                    "bg-amber-400/20 text-amber-400"
                  )}>
                    <span className="text-lg font-bold">{daysRemaining}</span>
                    <span className="text-[10px]">روز</span>
                  </div>
                  <div>
                    <p className="font-medium text-amber-400">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.persianDate.day} {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'][event.persianDate.month - 1]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل ساعت مطالعه"
          value={formatHoursShort(stats.totalHours)}
          subtitle="این هفته"
          icon={Clock}
          color="hsl(200, 80%, 55%)"
          delay={0}
        />
        <StatCard
          title="تست‌های حل شده"
          value={stats.totalTests}
          subtitle="تست این هفته"
          icon={FileText}
          color="hsl(280, 70%, 60%)"
          delay={0.1}
        />
        <StatCard
          title="میانگین تکمیل"
          value={`${Math.round(stats.avgCompletion)}%`}
          subtitle="پیشرفت کلی"
          icon={Target}
          color="hsl(150, 70%, 45%)"
          delay={0.2}
        />
        <StatCard
          title="امتیاز هفته"
          value={weeklyScore}
          subtitle={stats.avgCompletion >= 70 ? 'عالی' : 'قابل بهبود'}
          icon={Award}
          color="hsl(45, 90%, 55%)"
          delay={0.3}
        />
      </div>

      {/* Today's Plan Section */}
      <GlassCard delay={0.35}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            برنامه امروز ({todayPlan?.dayName})
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="glass-button"
            onClick={navigateToWeeklyPlan}
          >
            <Plus className="w-4 h-4 ml-1" />
            ویرایش برنامه
          </Button>
        </div>

        {todayPlan?.sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">هنوز برنامه‌ای برای امروز ثبت نکرده‌اید</p>
            <Button onClick={navigateToWeeklyPlan} className="bg-gradient-to-r from-primary to-accent">
              افزودن جلسه مطالعه
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayPlan?.sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                todayPlanId={todayPlan.id}
                toggleComplete={toggleSessionComplete}
              />
            ))}
          </div>
        )}

        {/* Today Summary */}
        {todayPlan && todayPlan.sessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              مجموع امروز: {formatHoursDisplay(todayActualHours)} از {formatHoursDisplay(todayTargetHours)}
            </span>
            <Button 
              size="sm" 
              onClick={navigateToDailyLog}
              className="bg-gradient-to-r from-primary to-accent"
            >
              ثبت عملکرد
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Charts - Lazy loaded */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
      }>
        <LazyCharts 
          weeklyChartData={weeklyChartData}
          subjectData={subjectData}
          todayPercent={todayPercent}
          todayPlan={todayPlan}
          todayCompleted={todayCompleted}
          todayTotal={todayTotal}
          todayActualHours={todayActualHours}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
