import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { CompactDayCard } from '@/components/CompactDayCard';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';
import { AppLayout } from '@/components/AppLayout';
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

// Memoized summary stats component
const WeekSummary = memo(({ 
  totalSessions, 
  completedSessions, 
  totalTargetHours, 
  totalTargetTests 
}: {
  totalSessions: number;
  completedSessions: number;
  totalTargetHours: number;
  totalTargetTests: number;
}) => (
  <div className="flex items-center justify-between gap-2 text-sm">
    <div className="flex items-center gap-1">
      <span className="font-bold text-primary">{totalSessions}</span>
      <span className="text-muted-foreground">جلسه</span>
    </div>
    <div className="flex items-center gap-1">
      <span className="font-bold text-primary">{completedSessions}</span>
      <span className="text-muted-foreground">تکمیل</span>
    </div>
    <div className="flex items-center gap-1">
      <span className="font-bold text-primary">{formatHoursShort(totalTargetHours)}</span>
      <span className="text-muted-foreground">ساعت</span>
    </div>
    <div className="flex items-center gap-1">
      <span className="font-bold text-primary">{totalTargetTests}</span>
      <span className="text-muted-foreground">تست</span>
    </div>
  </div>
));

WeekSummary.displayName = 'WeekSummary';

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
      title: "✅ هفته بازنشانی شد",
      description: "تمام نتایج و گزارش‌ها پاک شدند. برنامه هفتگی حفظ شده است.",
    });
  }, [resetWeek]);

  const openResetDialog = useCallback(() => setShowResetDialog(true), []);
  const closeResetDialog = useCallback(() => setShowResetDialog(false), []);

  // Memoize summary calculations
  const summaryStats = useMemo(() => {
    const totalSessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
    const completedSessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.filter(s => s.completed).length, 0);
    const totalTargetHours = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetHours, 0), 0);
    const totalTargetTests = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetTests, 0), 0);
    return { totalSessions, completedSessions, totalTargetHours, totalTargetTests };
  }, [weeklyPlan]);

  return (
    <AppLayout>
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">برنامه هفتگی</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={openResetDialog}
          className="text-warning hover:text-warning"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Compact Summary */}
      <div className="glass-card rounded-lg p-3">
        <WeekSummary {...summaryStats} />
      </div>

      {/* Compact Days Grid */}
      <div className="grid grid-cols-1 gap-2">
        {weeklyPlan.map((day) => (
          <CompactDayCard key={day.id} day={day} />
        ))}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="glass-card border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-warning" />
              بازنشانی هفته
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              آیا مطمئنی می‌خوای همه اطلاعات این هفته پاک بشه؟
              <br />
              <span className="text-sm mt-2 block">
                برنامه هفتگی و جلسات حفظ می‌شوند، فقط ساعات و تست‌های ثبت شده صفر می‌شوند.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="glass-button" onClick={closeResetDialog}>انصراف</AlertDialogCancel>
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
