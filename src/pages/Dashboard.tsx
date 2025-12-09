import { useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { Clock, FileText, Target, TrendingUp, Flame, Award, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { StatCard } from '@/components/StatCard';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatHoursDisplay, formatHoursShort } from '@/lib/timeUtils';
import { useNavigate } from 'react-router-dom';

// Lazy load charts
const LazyCharts = lazy(() => import('@/components/DashboardCharts'));

// Loading skeleton for charts
const ChartSkeleton = () => (
  <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
);

// Daily motivational quotes
const DAILY_QUOTES = [
  { quote: "هر روز یک قدم کوچک، در انتها یک مسیر بزرگ می‌سازد.", author: "موفقیت" },
  { quote: "سخت‌کوشی امروز، آسایش فرداست.", author: "تلاش" },
  { quote: "رویاهایت را بزرگ ببین، اما از قدم‌های کوچک شروع کن.", author: "پشتکار" },
  { quote: "هر استاد بزرگی، روزی دانش‌آموزی مبتدی بوده است.", author: "صبر" },
  { quote: "موفقیت مجموعه تلاش‌های کوچک روزانه است.", author: "استمرار" },
  { quote: "امروز سخت‌تر تلاش کن تا فردا راحت‌تر زندگی کنی.", author: "انگیزه" },
  { quote: "هر صفحه‌ای که می‌خوانی، پلی به سوی آینده‌ات می‌سازد.", author: "مطالعه" },
  { quote: "باور داشته باش که می‌توانی، نیمی از راه را رفته‌ای.", author: "اعتماد" },
  { quote: "زمانی که برای مطالعه می‌گذاری، سرمایه‌گذاری برای آینده‌ات است.", author: "آینده" },
  { quote: "هر تست که حل می‌کنی، یک قدم به هدفت نزدیک‌تری.", author: "پیشرفت" },
  { quote: "استراحت کن، اما هرگز تسلیم نشو.", author: "استقامت" },
  { quote: "کسی که هر روز ۱٪ بهتر شود، در سال ۳۷ برابر بهتر می‌شود.", author: "رشد" },
  { quote: "موفقیت یک شبه نمی‌آید، اما مطمئناً می‌آید.", author: "صبوری" },
  { quote: "ذهن تو مثل یک چتر است، فقط وقتی باز باشد کار می‌کند.", author: "یادگیری" },
];

// Get today's quote based on day of year - memoized
const getTodayQuote = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

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
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

const Dashboard = () => {
  const { weeklyPlan, initializeWeek, getStats, streak, getTodayIndex, toggleSessionComplete } = useStudyStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const todayQuote = useMemo(() => getTodayQuote(), []);
  const stats = useMemo(() => getStats(), [getStats, weeklyPlan]);
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
