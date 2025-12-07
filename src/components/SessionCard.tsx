import { motion } from 'framer-motion';
import { Clock, FileText, CheckCircle2, Circle, Trash2, Edit2 } from 'lucide-react';
import { StudySession } from '@/stores/studyStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SessionCardProps {
  session: StudySession;
  onToggleComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export const SessionCard = ({ session, onToggleComplete, onDelete, onEdit }: SessionCardProps) => {
  const completionPercent = session.targetHours > 0 
    ? Math.min(100, (session.actualHours / session.targetHours) * 100)
    : 0;

  const getStatusClass = () => {
    if (session.completed || completionPercent >= 90) return 'status-excellent';
    if (completionPercent >= 60) return 'status-good';
    return 'status-needs-work';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={cn(
        'glass-card rounded-xl p-4 border transition-all duration-300',
        session.completed ? 'border-success/30 bg-success/5' : 'border-white/10'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleComplete}
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
            onClick={onEdit}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-secondary" />
          <span className="text-muted-foreground">
            {session.actualHours.toFixed(1)} / {session.targetHours.toFixed(1)} ساعت
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">
            {session.actualTests} / {session.targetTests} تست
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">پیشرفت</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              getStatusClass()
            )}
          >
            {Math.round(completionPercent)}%
          </span>
        </div>
        <Progress
          value={completionPercent}
          className="h-2"
          indicatorClassName={cn(
            completionPercent >= 90 ? 'bg-success' :
            completionPercent >= 60 ? 'bg-warning' : 'bg-destructive'
          )}
        />
      </div>

      {session.notes && (
        <p className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          {session.notes}
        </p>
      )}
    </motion.div>
  );
};
