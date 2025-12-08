import { useEffect, useMemo } from 'react';
import { Clock, FileText, Target, TrendingUp, Flame, Award, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { StatCard } from '@/components/StatCard';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatHoursDisplay, formatHoursShort } from '@/lib/timeUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

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

// Get today's quote based on day of year
const getTodayQuote = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

// Custom tooltip formatter for charts
const formatChartTooltip = (value: number, name: string) => {
  if (name === 'ساعت' || name === 'هدف') {
    return [formatHoursShort(value), name];
  }
  return [value, name];
};

const Dashboard = () => {
  const { weeklyPlan, initializeWeek, getStats, dailyLogs, streak, getTodayIndex, toggleSessionComplete, updateSession } = useStudyStore();
  const navigate = useNavigate();
  const todayQuote = getTodayQuote();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const stats = getStats();
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];

  // Calculate today's progress
  const todayCompleted = todayPlan?.sessions.filter(s => s.completed).length || 0;
  const todayTotal = todayPlan?.sessions.length || 0;
  const todayPercent = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  // Calculate today's actual hours
  const todayActualHours = useMemo(() => {
    return todayPlan?.sessions.reduce((sum, s) => sum + s.actualHours, 0) || 0;
  }, [todayPlan]);

  const todayTargetHours = useMemo(() => {
    return todayPlan?.sessions.reduce((sum, s) => sum + s.targetHours, 0) || 0;
  }, [todayPlan]);

  // Prepare chart data with full Persian day names
  const weeklyChartData = weeklyPlan.map(day => ({
    name: day.dayName,
    ساعت: day.sessions.reduce((sum, s) => sum + s.actualHours, 0),
    تست: day.sessions.reduce((sum, s) => sum + s.actualTests, 0),
    هدف: day.sessions.reduce((sum, s) => sum + s.targetHours, 0),
  }));

  // Subject performance data
  const subjectData = Object.entries(stats.subjectStats).map(([subject, data]) => ({
    name: subject,
    ساعت: data.hours,
    تست: data.tests,
  }));

  // Get performance status
  const getPerformanceStatus = (actual: number, target: number) => {
    if (target === 0) return { color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'بدون هدف' };
    const percent = (actual / target) * 100;
    if (percent >= 100) return { color: 'text-success', bg: 'status-excellent', label: '✓ عالی' };
    if (percent >= 70) return { color: 'text-warning', bg: 'status-good', label: 'خوب' };
    return { color: 'text-destructive', bg: 'status-needs-work', label: 'نیاز به تلاش بیشتر' };
  };

  // Calculate weekly score
  const getWeeklyScore = () => {
    if (stats.avgCompletion >= 90) return 'A+';
    if (stats.avgCompletion >= 80) return 'A';
    if (stats.avgCompletion >= 70) return 'B+';
    if (stats.avgCompletion >= 60) return 'B';
    if (stats.avgCompletion >= 50) return 'C';
    return 'D';
  };

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
          value={getWeeklyScore()}
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
            onClick={() => navigate('/weekly-plan')}
          >
            <Plus className="w-4 h-4 ml-1" />
            ویرایش برنامه
          </Button>
        </div>

        {todayPlan?.sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">هنوز برنامه‌ای برای امروز ثبت نکرده‌اید</p>
            <Button onClick={() => navigate('/weekly-plan')} className="bg-gradient-to-r from-primary to-accent">
              افزودن جلسه مطالعه
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayPlan?.sessions.map((session, index) => {
              const hoursPercent = session.targetHours > 0 
                ? Math.min(100, (session.actualHours / session.targetHours) * 100) 
                : 0;
              const performance = getPerformanceStatus(session.actualHours, session.targetHours);

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border transition-all ${
                    session.completed 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-muted/20 border-white/5 hover:border-white/10'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSessionComplete(todayPlan.id, session.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
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
            })}
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
              onClick={() => navigate('/daily-log')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              ثبت عملکرد
            </Button>
          </div>
        )}
      </GlassCard>

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
                  contentStyle={{
                    backgroundColor: 'hsl(230, 20%, 12%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={formatChartTooltip}
                />
                <Area
                  type="monotone"
                  dataKey="ساعت"
                  stroke="hsl(250, 85%, 65%)"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
                <Area
                  type="monotone"
                  dataKey="هدف"
                  stroke="hsl(200, 80%, 55%)"
                  fillOpacity={1}
                  fill="url(#colorTarget)"
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

      {/* Subject Performance */}
      {subjectData.length > 0 && (
        <GlassCard delay={0.6}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">عملکرد به تفکیک درس</h3>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(230, 20%, 12%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="ساعت" fill="hsl(250, 85%, 65%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Recent Feedback */}
      {dailyLogs.length > 0 && (
        <GlassCard delay={0.7}>
          <h3 className="text-lg font-semibold mb-4">آخرین بازخوردها</h3>
          <div className="space-y-3">
            {dailyLogs.slice(-3).reverse().map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-muted/30 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    log.overallScore >= 80 ? 'status-excellent' :
                    log.overallScore >= 60 ? 'status-good' : 'status-needs-work'
                  }`}>
                    {Math.round(log.overallScore)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-sm">{log.feedback}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Dashboard;
