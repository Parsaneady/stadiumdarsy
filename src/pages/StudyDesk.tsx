import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, FileText, Users, Clock, BookOpen } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { useStudyStore } from '@/stores/studyStore';
import { useMemo } from 'react';

const studyDeskItems = [
  { 
    path: '/weekly-plan', 
    icon: Calendar, 
    label: 'برنامه هفتگی',
    description: 'تنظیم برنامه درسی هفتگی',
    gradient: 'from-primary to-accent'
  },
  { 
    path: '/daily-log', 
    icon: ClipboardList, 
    label: 'ثبت روزانه',
    description: 'تایمر مطالعه و ثبت فعالیت',
    gradient: 'from-warning to-accent'
  },
  { 
    path: '/exam', 
    icon: FileText, 
    label: 'پنل آزمون',
    description: 'آزمون و تصحیح پاسخ‌نامه',
    gradient: 'from-success to-primary'
  },
  { 
    path: '/pension', 
    icon: Users, 
    label: 'پانسیون',
    description: 'گروه مطالعاتی و همراهان',
    gradient: 'from-accent to-primary'
  },
];

// Format hours to HH:MM
const formatHoursToHHMM = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const StudyDesk = () => {
  const navigate = useNavigate();
  const { weeklyPlan, getTodayIndex } = useStudyStore();
  
  // Calculate today's stats
  const todayStats = useMemo(() => {
    const todayIndex = getTodayIndex();
    const todayPlan = weeklyPlan.find(d => d.dayIndex === todayIndex);
    
    if (!todayPlan) return { totalHours: 0, actualHours: 0, totalTests: 0, actualTests: 0 };
    
    const totalHours = todayPlan.sessions.reduce((sum, s) => sum + s.targetHours, 0);
    const actualHours = todayPlan.sessions.reduce((sum, s) => sum + s.actualHours, 0);
    const totalTests = todayPlan.sessions.reduce((sum, s) => sum + s.targetTests, 0);
    const actualTests = todayPlan.sessions.reduce((sum, s) => sum + s.actualTests, 0);
    
    return { totalHours, actualHours, totalTests, actualTests };
  }, [weeklyPlan, getTodayIndex]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">میز مطالعه</h1>
          <p className="text-muted-foreground">
            ابزارهای مدیریت مطالعه خود را انتخاب کنید
          </p>
        </div>

        {/* Today's Quick Stats */}
        <div className="flex justify-center gap-6 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">امروز:</span>
            <span className="font-mono font-bold text-primary">
              {formatHoursToHHMM(todayStats.actualHours)} / {formatHoursToHHMM(todayStats.totalHours)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/30">
            <span className="text-sm text-muted-foreground">تست:</span>
            <span className="font-mono font-bold text-success">
              {todayStats.actualTests} / {todayStats.totalTests}
            </span>
          </div>
        </div>

          {/* Islands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
            {studyDeskItems.map((item, index) => (
              <GlassCard key={item.path} delay={index * 0.1}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full text-right p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              </GlassCard>
            ))}
            
            {/* Answer Sheet Island */}
            <GlassCard delay={studyDeskItems.length * 0.1}>
              <button
                onClick={() => navigate('/test-book')}
                className="w-full text-right p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning to-success flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      پاسخ‌برگ کتاب تست
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      مدیریت و پیگیری پاسخ‌های کتاب‌های تستی
                    </p>
                  </div>
                </div>
              </button>
            </GlassCard>
          </div>
      </div>
    </AppLayout>
  );
};

export default StudyDesk;
