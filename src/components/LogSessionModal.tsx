import { useState, useEffect } from 'react';
import { X, Clock, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { TimeInput } from '@/components/TimeInput';
import { StudySession } from '@/stores/studyStore';
import { hoursToHoursMinutes, hoursMinutesToHours, formatHoursDisplay } from '@/lib/timeUtils';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession;
  onSave: (updates: Partial<StudySession>) => void;
}

export const LogSessionModal = ({ isOpen, onClose, session, onSave }: LogSessionModalProps) => {
  const initialActual = hoursToHoursMinutes(session.actualHours);
  const [actualHours, setActualHours] = useState(initialActual.hours);
  const [actualMinutes, setActualMinutes] = useState(initialActual.minutes);
  const [actualTests, setActualTests] = useState(session.actualTests.toString());
  const [completionPercent, setCompletionPercent] = useState(session.completionPercent);
  const [notes, setNotes] = useState(session.notes);

  useEffect(() => {
    const time = hoursToHoursMinutes(session.actualHours);
    setActualHours(time.hours);
    setActualMinutes(time.minutes);
    setActualTests(session.actualTests.toString());
    setCompletionPercent(session.completionPercent);
    setNotes(session.notes);
  }, [session]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalHours = hoursMinutesToHours(actualHours, actualMinutes);
    
    // Calculate if hours and tests are 100% complete for auto-check
    const hoursComplete = session.targetHours > 0 && totalHours >= session.targetHours;
    const testsComplete = session.targetTests > 0 && (parseInt(actualTests) || 0) >= session.targetTests;
    const autoComplete = hoursComplete && testsComplete;
    
    onSave({
      actualHours: totalHours,
      actualTests: parseInt(actualTests) || 0,
      completionPercent,
      notes,
      completed: autoComplete || completionPercent >= 100,
    });
    onClose();
  };

  const totalActualHours = hoursMinutesToHours(actualHours, actualMinutes);
  const hoursPercent = session.targetHours > 0 
    ? Math.min(100, (totalActualHours / session.targetHours) * 100) 
    : 0;
  
  const testsPercent = session.targetTests > 0 
    ? Math.min(100, (parseInt(actualTests) / session.targetTests) * 100) 
    : 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 w-full max-w-md animate-scale-in"
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
                هدف: {formatHoursDisplay(session.targetHours)}
              </span>
            </div>
            <TimeInput
              hours={actualHours}
              minutes={actualMinutes}
              onHoursChange={setActualHours}
              onMinutesChange={setActualMinutes}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={hoursPercent >= 100 ? 'text-success' : hoursPercent >= 70 ? 'text-warning' : 'text-destructive'}>
                {Math.round(hoursPercent)}% از هدف
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
                {Math.round(testsPercent)}% از هدف
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
      </div>
    </div>
  );
};
