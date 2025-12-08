import { useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, BookOpen, Clock, FileText } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { GlassCard } from '@/components/GlassCard';
import { CircularProgress } from '@/components/CircularProgress';
import { formatHoursShort, formatHoursDisplay } from '@/lib/timeUtils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const Analytics = () => {
  const { weeklyPlan, dailyLogs, initializeWeek, getStats } = useStudyStore();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const stats = getStats();

  // Prepare data for charts
  const weeklyProgressData = weeklyPlan.map(day => {
    const actual = day.sessions.reduce((sum, s) => sum + s.actualHours, 0);
    const target = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
    return {
      name: day.dayName,
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
    تست: data.tests / 10, // Scale down for visualization
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

  // Calculate rankings
  const subjectRankings = Object.entries(stats.subjectStats)
    .sort((a, b) => b[1].hours - a[1].hours)
    .map(([name, data], index) => ({
      rank: index + 1,
      name,
      hours: data.hours,
      tests: data.tests,
      color: COLORS[index % COLORS.length],
    }));

  return (
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
        {[
          { icon: Clock, label: 'کل ساعات', value: formatHoursShort(stats.totalHours), unit: '', color: '#06b6d4' },
          { icon: FileText, label: 'کل تست‌ها', value: stats.totalTests, unit: 'تست', color: '#8b5cf6' },
          { icon: Target, label: 'میانگین تکمیل', value: `${stats.avgCompletion.toFixed(0)}%`, unit: '', color: '#10b981' },
          { icon: BookOpen, label: 'تعداد درس‌ها', value: Object.keys(stats.subjectStats).length, unit: '', color: '#f59e0b' },
        ].map((stat, index) => (
          <GlassCard key={stat.label} delay={index * 0.1} className="text-center">
            <stat.icon className="w-8 h-8 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label} {stat.unit}</p>
          </GlassCard>
        ))}
      </div>

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
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(230, 20%, 12%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    direction: 'rtl',
                  }}
                />
                <Area type="monotone" dataKey="هدف" stroke="#06b6d4" fill="url(#gradientTarget)" strokeWidth={2} />
                <Area type="monotone" dataKey="عملکرد" stroke="#8b5cf6" fill="url(#gradientActual)" strokeWidth={2} />
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
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(230, 20%, 12%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [`${Math.floor(value)} ساعت`, '']}
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
                <span className="text-xs text-muted-foreground">{item.name}</span>
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
                  <Radar name="ساعت" dataKey="ساعت" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Radar name="تست" dataKey="تست" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(230, 20%, 12%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="تکمیل" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="باقیمانده" stackId="a" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
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
          {subjectRankings.map((subject, index) => (
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
                value={Math.min(100, (subject.hours / (stats.totalHours || 1)) * 100)}
                size={50}
                strokeWidth={4}
                color={subject.color}
                showValue={false}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Performance History */}
      {dailyLogs.length > 0 && (
        <GlassCard delay={0.8}>
          <h3 className="text-lg font-semibold mb-4">تاریخچه عملکرد</h3>
          <div className="space-y-3">
            {dailyLogs.slice(-7).reverse().map((log, index) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30"
              >
                <div>
                  <p className="font-medium">
                    {new Date(log.date).toLocaleDateString('fa-IR', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{log.feedback}</p>
                </div>
                <div className="text-left">
                  <p className={`text-xl font-bold ${
                    log.overallScore >= 80 ? 'text-success' :
                    log.overallScore >= 60 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {log.overallScore.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatHoursDisplay(log.totalStudyHours)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Analytics;
