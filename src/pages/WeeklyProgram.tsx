import { useEffect, useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DayCard } from '@/components/DayCard';
import { useStudyStore } from '@/stores/studyStore';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, BookOpen, Target, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const WeeklyProgram = () => {
  const { weeklyPlan, initializeWeek, resetWeek } = useStudyStore();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const handleResetWeek = useCallback(() => {
    resetWeek();
    toast.success('برنامه هفتگی ریست شد!');
  }, [resetWeek]);

  const stats = useMemo(() => {
    const totalSessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
    const completedSessions = weeklyPlan.reduce(
      (sum, day) => sum + day.sessions.filter(s => s.completed).length, 0
    );
    const totalHours = weeklyPlan.reduce(
      (sum, day) => sum + day.sessions.reduce((h, s) => h + s.targetHours, 0), 0
    );
    const totalTests = weeklyPlan.reduce(
      (sum, day) => sum + day.sessions.reduce((t, s) => t + s.targetTests, 0), 0
    );
    return { totalSessions, completedSessions, totalHours, totalTests };
  }, [weeklyPlan]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
              برنامه هفتگی
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              برنامه‌ریزی و پیگیری مطالعه هفتگی
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                ریست هفته
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ریست برنامه هفتگی</AlertDialogTitle>
                <AlertDialogDescription>
                  آیا مطمئن هستید؟ تمام پیشرفت‌های این هفته پاک خواهد شد.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>انصراف</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetWeek}>
                  بله، ریست کن
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">جلسه</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completedSessions}</p>
              <p className="text-xs text-muted-foreground">تکمیل شده</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">ساعت</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTests}</p>
              <p className="text-xs text-muted-foreground">تست</p>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          {weeklyPlan.map((day, index) => (
            <DayCard key={day.id} day={day} delay={index * 50} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default WeeklyProgram;
