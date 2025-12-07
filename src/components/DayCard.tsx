import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { DayPlan, StudySession, useStudyStore } from '@/stores/studyStore';
import { SessionCard } from './SessionCard';
import { AddSessionModal } from './AddSessionModal';
import { Button } from '@/components/ui/button';
import { GlassCard } from './GlassCard';

interface DayCardProps {
  day: DayPlan;
  delay?: number;
}

export const DayCard = ({ day, delay = 0 }: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const { addSession, updateSession, deleteSession, toggleSessionComplete } = useStudyStore();

  const completedCount = day.sessions.filter((s) => s.completed).length;
  const totalHours = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
  const completionPercent = day.sessions.length > 0 
    ? (completedCount / day.sessions.length) * 100 
    : 0;

  const handleAddSession = (session: Omit<StudySession, 'id'>) => {
    if (editingSession) {
      updateSession(day.id, editingSession.id, session);
      setEditingSession(null);
    } else {
      addSession(day.id, session);
    }
  };

  const handleEdit = (session: StudySession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  return (
    <>
      <GlassCard delay={delay} hover={false} className="overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{day.dayIndex + 1}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{day.dayName}</h3>
              <p className="text-sm text-muted-foreground">
                {day.sessions.length} جلسه • {totalHours.toFixed(1)} ساعت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion Badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              completionPercent === 100 ? 'bg-success/20 text-success' :
              completionPercent >= 50 ? 'bg-warning/20 text-warning' :
              'bg-muted text-muted-foreground'
            }`}>
              {completedCount}/{day.sessions.length}
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>

        {/* Sessions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {day.sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onToggleComplete={() => toggleSessionComplete(day.id, session.id)}
                    onDelete={() => deleteSession(day.id, session.id)}
                    onEdit={() => handleEdit(session)}
                  />
                ))}

                {/* Add Session Button */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => {
                    setEditingSession(null);
                    setIsModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن جلسه جدید
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

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
};
