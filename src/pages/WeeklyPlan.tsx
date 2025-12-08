import { useEffect, useState } from 'react';
import { Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { DayCard } from '@/components/DayCard';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';
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

  const handleResetWeek = () => {
    resetWeek();
    setShowResetDialog(false);
    toast({
      title: "✅ هفته بازنشانی شد",
      description: "تمام نتایج و گزارش‌ها پاک شدند. برنامه هفتگی حفظ شده است.",
    });
  };

  const totalSessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
  const completedSessions = weeklyPlan.reduce((sum, day) => sum + day.sessions.filter(s => s.completed).length, 0);
  const totalTargetHours = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetHours, 0), 0);
  const totalTargetTests = weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetTests, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">برنامه هفتگی</h1>
            <p className="text-muted-foreground mt-1">
              جلسات مطالعه خود را برنامه‌ریزی کنید
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          className="glass-button text-warning hover:text-warning"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          بازنشانی هفته
        </Button>
      </div>

      {/* Week Summary */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-around">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{totalSessions}</p>
          <p className="text-sm text-muted-foreground">کل جلسات</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{completedSessions}</p>
          <p className="text-sm text-muted-foreground">تکمیل شده</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{formatHoursShort(totalTargetHours)}</p>
          <p className="text-sm text-muted-foreground">ساعت هدف</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{totalTargetTests}</p>
          <p className="text-sm text-muted-foreground">تست هدف</p>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {weeklyPlan.map((day, index) => (
          <DayCard key={day.id} day={day} delay={0.2 + index * 0.05} />
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
            <AlertDialogCancel className="glass-button">انصراف</AlertDialogCancel>
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
  );
};

export default WeeklyPlan;
