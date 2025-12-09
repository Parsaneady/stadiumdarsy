import { memo, useCallback, useMemo } from 'react';
import { Clock, FileText, CheckCircle2, Circle, Trash2, Edit2 } from 'lucide-react';
import { StudySession } from '@/stores/studyStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: StudySession;
  onToggleComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const SessionCard = memo(({ session, onToggleComplete, onDelete, onEdit }: SessionCardProps) => {
  const completionPercent = useMemo(() => {
    return session.targetHours > 0 
      ? Math.min(100, (session.actualHours / session.targetHours) * 100)
      : 0;
  }, [session.actualHours, session.targetHours]);

  const statusClass = useMemo(() => {
    if (session.completed || completionPercent >= 90) return 'status-excellent';
    if (completionPercent >= 60) return 'status-good';
    return 'status-needs-work';
  }, [session.completed, completionPercent]);

  const indicatorClass = useMemo(() => {
    if (completionPercent >= 90) return 'bg-success';
    if (completionPercent >= 60) return 'bg-warning';
    return 'bg-destructive';
  }, [completionPercent]);

  const hoursDisplay = useMemo(() => (
    `${formatHoursShort(session.actualHours)} / ${formatHoursShort(session.targetHours)}`
  ), [session.actualHours, session.targetHours]);

  const testsDisplay = useMemo(() => (
    `${session.actualTests} / ${session.targetTests} تست`
  ), [session.actualTests, session.targetTests]);

  const handleToggle = useCallback(() => onToggleComplete(), [onToggleComplete]);
  const handleDelete = useCallback(() => onDelete(), [onDelete]);
  const handleEdit = useCallback(() => onEdit(), [onEdit]);

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-4 border transition-transform duration-200 hover:-translate-y-0.5',
        session.completed ? 'border-success/30 bg-success/5' : 'border-white/10'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="transition-transform hover:scale-110"
          >
            {session.completed ? (
              <CheckCircle2 className="w-6 h-6 text-success" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          <div>
            <h4
              className={cn(
                'font-semibold text-lg',
                session.completed && 'line-through opacity-60'
              )}
              style={{ color: session.color }}
            >
              {session.subject}
            </h4>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-secondary" />
          <span className="text-muted-foreground">{hoursDisplay}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">{testsDisplay}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">پیشرفت</span>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusClass)}>
            {Math.round(completionPercent)}%
          </span>
        </div>
        <Progress
          value={completionPercent}
          className="h-2"
          indicatorClassName={indicatorClass}
        />
      </div>

      {session.notes && (
        <p className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          {session.notes}
        </p>
      )}
    </div>
  );
});

SessionCard.displayName = 'SessionCard';
