import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Calendar, RefreshCw, AlertTriangle, Plus, Clock, FileText, ChevronDown, Trash2, Edit2, Check } from 'lucide-react';
import { useStudyStore, DayPlan, StudySession } from '@/stores/studyStore';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';
import { AppLayout } from '@/components/AppLayout';
import { AddSessionModal } from '@/components/AddSessionModal';
import { SessionCard } from '@/components/SessionCard';
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

// Compact Day Row Component
const DayRow = memo(({ day }: { day: DayPlan }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const { addSession, updateSession, deleteSession, toggleSessionComplete } = useStudyStore();

  const stats = useMemo(() => {
    const completed = day.sessions.filter((s) => s.completed).length;
    const hours = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
    const tests = day.sessions.reduce((sum, s) => sum + s.targetTests, 0);
    return { completed, hours, tests, total: day.sessions.length };
  }, [day.sessions]);

  const handleAddSession = useCallback((session: Omit<StudySession, 'id'>) => {
    if (editingSession) {
      updateSession(day.id, editingSession.id, session);
      setEditingSession(null);
    } else {
      addSession(day.id, session);
    }
  }, [editingSession, updateSession, addSession, day.id]);

  const handleEdit = useCallback((session: StudySession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  }, []);

  return (
    <>
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Row Header */}
        <div
          className="flex items-center p-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Day Number & Name */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {day.dayIndex + 1}
            </div>
            <span className="font-medium text-sm">{day.dayName}</span>
          </div>

          {/* Stats */}
          <div className="flex-1 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatHoursShort(stats.hours)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {stats.tests}
            </span>
          </div>

          {/* Completion & Expand */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              stats.completed === stats.total && stats.total > 0
                ? 'bg-success/20 text-success'
                : 'bg-muted/50 text-muted-foreground'
            }`}>
              {stats.completed}/{stats.total}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2">
            {day.sessions.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-4">جلسه‌ای تعریف نشده</p>
            ) : (
              day.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onToggleComplete={() => toggleSessionComplete(day.id, session.id)}
                  onDelete={() => deleteSession(day.id, session.id)}
                  onEdit={() => handleEdit(session)}
                />
              ))
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full border border-dashed border-white/10 hover:border-primary/30 text-xs h-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditingSession(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-3 h-3 ml-1" />
              جلسه جدید
            </Button>
          </div>
        )}
      </div>

      <AddSessionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onAdd={handleAddSession}
        editSession={editingSession}
      />
    </>
  );
});

DayRow.displayName = 'DayRow';

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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">برنامه هفتگی</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowResetDialog(true)}
            className="text-warning hover:text-warning h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-around text-center py-2 px-3 glass-card rounded-lg">
          <div>
            <div className="text-lg font-bold text-primary">{stats.sessions}</div>
            <div className="text-[10px] text-muted-foreground">جلسه</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-lg font-bold text-success">{stats.completed}</div>
            <div className="text-[10px] text-muted-foreground">تکمیل</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-lg font-bold text-secondary">{formatHoursShort(stats.hours)}</div>
            <div className="text-[10px] text-muted-foreground">ساعت</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-lg font-bold text-accent">{stats.tests}</div>
            <div className="text-[10px] text-muted-foreground">تست</div>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-2">
          {weeklyPlan.map((day) => (
            <DayRow key={day.id} day={day} />
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
                همه نتایج پاک می‌شوند. برنامه حفظ می‌شود.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetWeek}
                className="bg-destructive text-destructive-foreground"
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
