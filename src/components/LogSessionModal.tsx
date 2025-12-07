import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { StudySession } from '@/stores/studyStore';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession;
  onSave: (updates: Partial<StudySession>) => void;
}

export const LogSessionModal = ({ isOpen, onClose, session, onSave }: LogSessionModalProps) => {
  const [actualHours, setActualHours] = useState(session.actualHours.toString());
  const [actualTests, setActualTests] = useState(session.actualTests.toString());
  const [completionPercent, setCompletionPercent] = useState(session.completionPercent);
  const [notes, setNotes] = useState(session.notes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      actualHours: parseFloat(actualHours) || 0,
      actualTests: parseInt(actualTests) || 0,
      completionPercent,
      notes,
      completed: completionPercent >= 100,
    });
    onClose();
  };

  const hoursPercent = session.targetHours > 0 
    ? Math.min(100, (parseFloat(actualHours) / session.targetHours) * 100) 
    : 0;
  
  const testsPercent = session.targetTests > 0 
    ? Math.min(100, (parseInt(actualTests) / session.targetTests) * 100) 
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ color: session.color }}>
                  {session.subject}
                </h2>
                <p className="text-sm text-muted-foreground">ثبت عملکرد امروز</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Actual Hours */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    ساعت مطالعه
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    هدف: {session.targetHours.toFixed(1)} ساعت
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="bg-muted/50 border-white/10 text-lg"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={hoursPercent >= 100 ? 'text-success' : hoursPercent >= 70 ? 'text-warning' : 'text-destructive'}>
                    {hoursPercent.toFixed(0)}% از هدف
                  </span>
                </div>
              </div>

              {/* Actual Tests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    تعداد تست
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    هدف: {session.targetTests} تست
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={actualTests}
                  onChange={(e) => setActualTests(e.target.value)}
                  className="bg-muted/50 border-white/10 text-lg"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={testsPercent >= 100 ? 'text-success' : testsPercent >= 70 ? 'text-warning' : 'text-destructive'}>
                    {testsPercent.toFixed(0)}% از هدف
                  </span>
                </div>
              </div>

              {/* Completion Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>میزان تکمیل کلی</Label>
                  <span className="text-lg font-bold" style={{ color: session.color }}>
                    {completionPercent}%
                  </span>
                </div>
                <Slider
                  value={[completionPercent]}
                  onValueChange={(value) => setCompletionPercent(value[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>یادداشت</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="چطور گذشت؟ نکته‌ای هست؟"
                  className="bg-muted/50 border-white/10 resize-none"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Save className="w-4 h-4 ml-2" />
                ذخیره
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
