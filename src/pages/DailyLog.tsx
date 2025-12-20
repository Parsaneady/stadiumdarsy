import { useState, useEffect } from 'react';
import { ClipboardList, Save, Clock, FileText, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { useStudyStore, StudySession } from '@/stores/studyStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { LogSessionModal } from '@/components/LogSessionModal';
import { Progress } from '@/components/ui/progress';
import { formatHoursDisplay, formatHoursShort } from '@/lib/timeUtils';
import { toast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';

const DailyLog = () => {
  const { weeklyPlan, initializeWeek, updateSession, logDaily, getTodayIndex, toggleSessionComplete } = useStudyStore();
  const [selectedSession, setSelectedSession] = useState<{ dayId: string; session: StudySession } | null>(null);

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];

  const handleSaveSession = (updates: Partial<StudySession>) => {
    if (selectedSession) {
      updateSession(selectedSession.dayId, selectedSession.session.id, updates);
      setSelectedSession(null);
      toast({
        title: "✅ ذخیره شد",
        description: "اطلاعات جلسه به‌روزرسانی شد.",
      });
    }
  };

  const handleSaveDay = () => {
    if (todayPlan) {
      logDaily(todayPlan.id);
      toast({
        title: "ذخیره شد! ✨",
        description: "عملکرد امروز با موفقیت ثبت شد.",
      });
    }
  };

  if (!todayPlan) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  const totalTarget = todayPlan.sessions.reduce((sum, s) => sum + s.targetHours, 0);
  const totalActual = todayPlan.sessions.reduce((sum, s) => sum + s.actualHours, 0);
  const overallPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const totalTargetTests = todayPlan.sessions.reduce((sum, s) => sum + s.targetTests, 0);
  const totalActualTests = todayPlan.sessions.reduce((sum, s) => sum + s.actualTests, 0);

  const getPerformanceFeedback = () => {
    if (overallPercent >= 100) return { icon: TrendingUp, text: 'عالی! به هدف رسیدی! 🎉', color: 'text-success' };
    if (overallPercent >= 70) return { icon: TrendingUp, text: 'خوب پیش می‌ری! ادامه بده! 💪', color: 'text-warning' };
    return { icon: TrendingDown, text: 'تلاش بیشتری لازمه. می‌تونی! 📚', color: 'text-destructive' };
  };

  const feedback = getPerformanceFeedback();

  return (
    <AppLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">ثبت روزانه</h1>
            <p className="text-muted-foreground mt-1">
              عملکرد امروز ({todayPlan.dayName}) را ثبت کنید
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveDay}
          className="bg-gradient-to-r from-success to-secondary hover:opacity-90"
        >
          <Save className="w-4 h-4 ml-2" />
          ثبت نهایی روز
        </Button>
      </div>

      {/* Today's Overview */}
      <GlassCard delay={0}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">خلاصه امروز</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            overallPercent >= 80 ? 'status-excellent' :
            overallPercent >= 50 ? 'status-good' : 'status-needs-work'
          }`}>
            {Math.round(overallPercent)}%
          </span>
        </div>
        <Progress
          value={Math.min(100, overallPercent)}
          className="h-3 mb-4"
          indicatorClassName={
            overallPercent >= 80 ? 'bg-success' :
            overallPercent >= 50 ? 'bg-warning' : 'bg-destructive'
          }
        />

        {/* Feedback */}
        <div className={`flex items-center gap-2 mb-4 ${feedback.color}`}>
          <feedback.icon className="w-5 h-5" />
          <span className="font-medium">{feedback.text}</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <Clock className="w-5 h-5 mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold">{formatHoursShort(totalActual)}</p>
            <p className="text-xs text-muted-foreground">از {formatHoursShort(totalTarget)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <FileText className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{totalActualTests}</p>
            <p className="text-xs text-muted-foreground">از {totalTargetTests} تست</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">
              {todayPlan.sessions.filter(s => s.completed).length}
            </p>
            <p className="text-xs text-muted-foreground">
              از {todayPlan.sessions.length} جلسه
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Sessions to Log */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">جلسات امروز</h3>
        
        {todayPlan.sessions.length === 0 ? (
          <GlassCard>
            <div className="text-center py-8">
              <p className="text-muted-foreground">هنوز جلسه‌ای برای امروز تعریف نشده است.</p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => window.location.href = '/weekly-plan'}
              >
                رفتن به برنامه هفتگی
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {todayPlan.sessions.map((session) => {
              const hoursPercent = session.targetHours > 0 
                ? (session.actualHours / session.targetHours) * 100 
                : 0;
              const testsPercent = session.targetTests > 0 
                ? (session.actualTests / session.targetTests) * 100 
                : 0;

              const isExcellent = hoursPercent >= 100 && testsPercent >= 100;
              const isGood = hoursPercent >= 70 || testsPercent >= 70;

              return (
                <div
                  key={session.id}
                  className={`glass-card rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.01] ${
                    session.completed 
                      ? 'border-success/30 bg-success/5' 
                      : 'hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedSession({ dayId: todayPlan.id, session })}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSessionComplete(todayPlan.id, session.id);
                        }}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          session.completed 
                            ? 'bg-success border-success text-white' 
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                      >
                        {session.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: session.color }}
                      />
                      <div>
                        <h4 className={`font-semibold text-lg ${session.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {session.subject}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          برای ویرایش کلیک کنید
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      session.completed ? 'status-excellent' :
                      isExcellent ? 'status-excellent' :
                      isGood ? 'status-good' : 'status-needs-work'
                    }`}>
                      {session.completed ? '✓ تکمیل شده' :
                       isExcellent ? '✓ عالی' :
                       isGood ? 'خوب' : 'نیاز به تلاش'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">ساعت مطالعه</span>
                        <span className={hoursPercent >= 100 ? 'text-success font-medium' : ''}>
                          {formatHoursShort(session.actualHours)} / {formatHoursShort(session.targetHours)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, hoursPercent)}
                        className="h-2"
                        indicatorClassName={hoursPercent >= 100 ? 'bg-success' : hoursPercent >= 50 ? 'bg-warning' : 'bg-secondary'}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">تست</span>
                        <span className={testsPercent >= 100 ? 'text-success font-medium' : ''}>
                          {session.actualTests} / {session.targetTests}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, testsPercent)}
                        className="h-2"
                        indicatorClassName={testsPercent >= 100 ? 'bg-success' : testsPercent >= 50 ? 'bg-warning' : 'bg-accent'}
                      />
                    </div>
                  </div>

                  {session.notes && (
                    <p className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
                      {session.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Session Modal */}
      {selectedSession && (
        <LogSessionModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession.session}
          onSave={handleSaveSession}
        />
      )}
    </div>
    </AppLayout>
  );
};

export default DailyLog;
