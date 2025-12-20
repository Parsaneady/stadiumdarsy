import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, RefreshCw, AlertTriangle, Plus, Clock, BookOpen } from 'lucide-react';
import { useStudyStore, DayPlan } from '@/stores/studyStore';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';
import { AppLayout } from '@/components/AppLayout';
import { DayCard } from '@/components/DayCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const WeeklyPlan = () => {
  const { weeklyPlan, initializeWeek, resetWeek } = useStudyStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const handleResetWeek = useCallback(() => {
    resetWeek();
    setShowResetDialog(false);
    toast({
      title: "✅ بازنشانی شد",
      description: "تمام نتایج پاک شدند.",
    });
  }, [resetWeek]);

  // Summary stats
  const stats = useMemo(() => {
    const sessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
    const completed = weeklyPlan.reduce((sum, day) => sum + day.sessions.filter(s => s.completed).length, 0);
    const hours = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetHours, 0), 0);
    const tests = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetTests, 0), 0);
    return { sessions, completed, hours, tests };
  }, [weeklyPlan]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">برنامه هفتگی</h1>
              <p className="text-muted-foreground text-sm">برنامه‌ریزی مطالعه</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowResetDialog(true)}
            className="text-warning hover:text-warning border-warning/20"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.sessions}</div>
            <div className="text-xs text-muted-foreground">جلسه</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">تکمیل شده</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-secondary" />
              <span className="text-2xl font-bold text-secondary">{formatHoursShort(stats.hours)}</span>
            </div>
            <div className="text-xs text-muted-foreground">ساعت</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-2xl font-bold text-accent">{stats.tests}</span>
            </div>
            <div className="text-xs text-muted-foreground">تست</div>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          {weeklyPlan.map((day, index) => (
            <DayCard key={day.id} day={day} delay={index * 0.05} />
          ))}
        </div>

        {/* Reset Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent className="glass-card border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                بازنشانی هفته
              </AlertDialogTitle>
              <AlertDialogDescription>
                آیا مطمئن هستید؟ همه نتایج پاک می‌شوند ولی برنامه حفظ می‌شود.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetWeek}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                بله، پاک کن
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default WeeklyPlan;
