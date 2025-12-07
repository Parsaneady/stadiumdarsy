import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Target, TrendingUp, Flame, Award } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { StatCard } from '@/components/StatCard';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const { weeklyPlan, initializeWeek, getStats, dailyLogs } = useStudyStore();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const stats = getStats();

  // Calculate today's progress
  const today = new Date().getDay();
  const todayPlan = weeklyPlan[today === 6 ? 0 : today + 1]; // Adjust for Persian week
  const todayCompleted = todayPlan?.sessions.filter(s => s.completed).length || 0;
  const todayTotal = todayPlan?.sessions.length || 0;
  const todayPercent = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  // Prepare chart data
  const weeklyChartData = weeklyPlan.map(day => ({
    name: day.dayName.slice(0, 3),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">داشبورد</h1>
          <p className="text-muted-foreground mt-1">خلاصه عملکرد این هفته</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10">
          <Flame className="w-5 h-5 text-warning" />
          <span className="font-medium">۷ روز متوالی</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل ساعت مطالعه"
          value={`${stats.totalHours.toFixed(1)}`}
          subtitle="ساعت این هفته"
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
          value={`${stats.avgCompletion.toFixed(0)}%`}
          subtitle="پیشرفت کلی"
          icon={Target}
          color="hsl(150, 70%, 45%)"
          delay={0.2}
        />
        <StatCard
          title="امتیاز هفته"
          value="A+"
          subtitle="رتبه عالی"
          icon={Award}
          color="hsl(45, 90%, 55%)"
          delay={0.3}
        />
      </div>

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
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(230, 20%, 12%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
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
                  {todayPlan?.sessions.reduce((sum, s) => sum + s.actualHours, 0).toFixed(1) || 0} ساعت
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Subject Performance */}
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

      {/* Recent Feedback */}
      {dailyLogs.length > 0 && (
        <GlassCard delay={0.7}>
          <h3 className="text-lg font-semibold mb-4">آخرین بازخوردها</h3>
          <div className="space-y-3">
            {dailyLogs.slice(-3).reverse().map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-muted/30 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    log.overallScore >= 80 ? 'status-excellent' :
                    log.overallScore >= 60 ? 'status-good' : 'status-needs-work'
                  }`}>
                    {log.overallScore.toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <p className="text-sm">{log.feedback}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Dashboard;
