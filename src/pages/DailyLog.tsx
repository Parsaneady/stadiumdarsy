import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Save, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { useStudyStore, StudySession } from '@/stores/studyStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { LogSessionModal } from '@/components/LogSessionModal';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

const DailyLog = () => {
  const { weeklyPlan, initializeWeek, updateSession, logDaily } = useStudyStore();
  const [selectedSession, setSelectedSession] = useState<{ dayId: string; session: StudySession } | null>(null);

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  // Get today's index (adjusting for Persian week where Saturday = 0)
  const today = new Date().getDay();
  const persianDayIndex = today === 6 ? 0 : today + 1;
  const todayPlan = weeklyPlan[persianDayIndex];

  const handleSaveSession = (updates: Partial<StudySession>) => {
    if (selectedSession) {
      updateSession(selectedSession.dayId, selectedSession.session.id, updates);
      setSelectedSession(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
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
      </motion.div>

      {/* Today's Overview */}
      <GlassCard delay={0.1}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">خلاصه امروز</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            overallPercent >= 80 ? 'status-excellent' :
            overallPercent >= 50 ? 'status-good' : 'status-needs-work'
          }`}>
            {overallPercent.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={overallPercent}
          className="h-3 mb-4"
          indicatorClassName={
            overallPercent >= 80 ? 'bg-success' :
            overallPercent >= 50 ? 'bg-warning' : 'bg-destructive'
          }
        />
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <Clock className="w-5 h-5 mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold">{totalActual.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">از {totalTarget.toFixed(1)} ساعت</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <FileText className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">
              {todayPlan.sessions.reduce((sum, s) => sum + s.actualTests, 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              از {todayPlan.sessions.reduce((sum, s) => sum + s.targetTests, 0)} تست
            </p>
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
        <AnimatePresence>
          {todayPlan.sessions.map((session, index) => {
            const hoursPercent = session.targetHours > 0 
              ? (session.actualHours / session.targetHours) * 100 
              : 0;
            const testsPercent = session.targetTests > 0 
              ? (session.actualTests / session.targetTests) * 100 
              : 0;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setSelectedSession({ dayId: todayPlan.id, session })}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: session.color }}
                    />
                    <div>
                      <h4 className="font-semibold text-lg">{session.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        برای ویرایش کلیک کنید
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.completed ? 'status-excellent' :
                    session.completionPercent >= 50 ? 'status-good' : 'status-needs-work'
                  }`}>
                    {session.completed ? 'تکمیل شده' : `${session.completionPercent}%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">ساعت مطالعه</span>
                      <span>{session.actualHours.toFixed(1)} / {session.targetHours.toFixed(1)}</span>
                    </div>
                    <Progress
                      value={Math.min(100, hoursPercent)}
                      className="h-2"
                      indicatorClassName="bg-secondary"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">تست</span>
                      <span>{session.actualTests} / {session.targetTests}</span>
                    </div>
                    <Progress
                      value={Math.min(100, testsPercent)}
                      className="h-2"
                      indicatorClassName="bg-accent"
                    />
                  </div>
                </div>

                {session.notes && (
                  <p className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
                    {session.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
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
  );
};

export default DailyLog;
