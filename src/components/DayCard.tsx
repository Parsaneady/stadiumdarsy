import { useState, useCallback, useMemo, memo, useRef } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { DayPlan, StudySession, useStudyStore } from '@/stores/studyStore';
import { SessionCard } from './SessionCard';
import { AddSessionModal } from './AddSessionModal';
import { Button } from '@/components/ui/button';
import { GlassCard } from './GlassCard';
import { formatHoursShort } from '@/lib/timeUtils';
import { useCloudSync } from '@/hooks/useCloudSync';

interface DayCardProps {
  day: DayPlan;
  delay?: number;
}

export const DayCard = memo(({ day, delay = 0 }: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const { addSession, updateSession, deleteSession, toggleSessionComplete } = useStudyStore();
  const { saveWeeklyPlan } = useCloudSync();
  
  // Track if user made local changes (not from cloud load)
  const hasUserChangedRef = useRef(false);

  const { completedCount, totalHours, completionPercent } = useMemo(() => {
    const completed = day.sessions.filter((s) => s.completed).length;
    const hours = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
    const percent = day.sessions.length > 0 
      ? (completed / day.sessions.length) * 100 
      : 0;
    return { completedCount: completed, totalHours: hours, completionPercent: percent };
  }, [day.sessions]);

  const handleAddSession = useCallback(async (session: Omit<StudySession, 'id'>) => {
    if (editingSession) {
      updateSession(day.id, editingSession.id, session);
      // Save to cloud after update
      const updatedSessions = day.sessions.map(s => 
        s.id === editingSession.id ? { ...s, ...session } : s
      );
      await saveWeeklyPlan(day.id, updatedSessions);
      setEditingSession(null);
    } else {
      addSession(day.id, session);
      // Save to cloud after add - get fresh sessions with new one
      setTimeout(async () => {
        const store = useStudyStore.getState();
        const updatedDay = store.weeklyPlan.find(d => d.id === day.id);
        if (updatedDay) {
          await saveWeeklyPlan(day.id, updatedDay.sessions);
        }
      }, 100);
    }
  }, [editingSession, updateSession, addSession, day.id, day.sessions, saveWeeklyPlan]);

  const handleEdit = useCallback((session: StudySession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSession(null);
  }, []);

  const handleOpenModal = useCallback(() => {
    setEditingSession(null);
    setIsModalOpen(true);
  }, []);

  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  const completionBadgeClass = useMemo(() => {
    if (completionPercent === 100) return 'bg-success/20 text-success';
    if (completionPercent >= 50) return 'bg-warning/20 text-warning';
    return 'bg-muted text-muted-foreground';
  }, [completionPercent]);

  return (
    <>
      <GlassCard delay={delay} hover={false} className="overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{day.dayIndex + 1}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{day.dayName}</h3>
              <p className="text-sm text-muted-foreground">
                {day.sessions.length} جلسه • {formatHoursShort(totalHours)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${completionBadgeClass}`}>
              {completedCount}/{day.sessions.length}
            </div>
            
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>

        {/* Sessions */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {day.sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onToggleComplete={async () => {
                  toggleSessionComplete(day.id, session.id);
                  // Save to cloud after toggle
                  setTimeout(async () => {
                    const store = useStudyStore.getState();
                    const updatedDay = store.weeklyPlan.find(d => d.id === day.id);
                    if (updatedDay) {
                      await saveWeeklyPlan(day.id, updatedDay.sessions);
                    }
                  }, 100);
                }}
                onDelete={async () => {
                  deleteSession(day.id, session.id);
                  // Save to cloud after delete
                  setTimeout(async () => {
                    const store = useStudyStore.getState();
                    const updatedDay = store.weeklyPlan.find(d => d.id === day.id);
                    if (updatedDay) {
                      await saveWeeklyPlan(day.id, updatedDay.sessions);
                    }
                  }, 100);
                }}
                onEdit={() => handleEdit(session)}
              />
            ))}

            <Button
              variant="outline"
              className="w-full border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5"
              onClick={handleOpenModal}
            >
              <Plus className="w-4 h-4 ml-2" />
              افزودن جلسه جدید
            </Button>
          </div>
        )}
      </GlassCard>

      <AddSessionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddSession}
        editSession={editingSession}
      />
    </>
  );
});

DayCard.displayName = 'DayCard';
