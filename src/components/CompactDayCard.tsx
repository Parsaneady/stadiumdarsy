import { useState, useCallback, useMemo, memo } from 'react';
import { Plus, ChevronDown, Clock, FileText } from 'lucide-react';
import { DayPlan, StudySession, useStudyStore } from '@/stores/studyStore';
import { SessionCard } from './SessionCard';
import { AddSessionModal } from './AddSessionModal';
import { Button } from '@/components/ui/button';
import { formatHoursShort } from '@/lib/timeUtils';

interface CompactDayCardProps {
  day: DayPlan;
}

export const CompactDayCard = memo(({ day }: CompactDayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const { addSession, updateSession, deleteSession, toggleSessionComplete } = useStudyStore();

  const { completedCount, totalHours, totalTests } = useMemo(() => {
    const completed = day.sessions.filter((s) => s.completed).length;
    const hours = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
    const tests = day.sessions.reduce((sum, s) => sum + s.targetTests, 0);
    return { completedCount: completed, totalHours: hours, totalTests: tests };
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

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSession(null);
  }, []);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(null);
    setIsModalOpen(true);
  }, []);

  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <>
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Compact Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{day.dayIndex + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{day.dayName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatHoursShort(totalHours)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {totalTests} تست
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              completedCount === day.sessions.length && day.sessions.length > 0
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground'
            }`}>
              {completedCount}/{day.sessions.length}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>

        {/* Sessions */}
        {isExpanded && (
          <div className="p-3 pt-0 space-y-2">
            {day.sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onToggleComplete={() => toggleSessionComplete(day.id, session.id)}
                onDelete={() => deleteSession(day.id, session.id)}
                onEdit={() => handleEdit(session)}
              />
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="w-full border border-dashed border-white/10 hover:border-primary/30 text-xs"
              onClick={handleOpenModal}
            >
              <Plus className="w-3 h-3 ml-1" />
              افزودن جلسه
            </Button>
          </div>
        )}
      </div>

      <AddSessionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddSession}
        editSession={editingSession}
      />
    </>
  );
});

CompactDayCard.displayName = 'CompactDayCard';
