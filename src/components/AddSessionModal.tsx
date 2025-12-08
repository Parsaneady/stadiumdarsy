import { useState, useEffect } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from '@/components/TimeInput';
import { StudySession } from '@/stores/studyStore';
import { hoursToHoursMinutes, hoursMinutesToHours } from '@/lib/timeUtils';

const SUBJECT_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
];

const PRESET_SUBJECTS = [
  'ریاضی', 'فیزیک', 'شیمی', 'زیست', 'زبان انگلیسی', 'ادبیات', 'عربی', 'دینی'
];

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (session: Omit<StudySession, 'id'>) => void;
  editSession?: StudySession | null;
}

export const AddSessionModal = ({ isOpen, onClose, onAdd, editSession }: AddSessionModalProps) => {
  const initialTime = editSession ? hoursToHoursMinutes(editSession.targetHours) : { hours: 1, minutes: 30 };
  
  const [subject, setSubject] = useState(editSession?.subject || '');
  const [targetHours, setTargetHours] = useState(initialTime.hours);
  const [targetMinutes, setTargetMinutes] = useState(initialTime.minutes);
  const [targetTests, setTargetTests] = useState(editSession?.targetTests?.toString() || '10');
  const [notes, setNotes] = useState(editSession?.notes || '');
  const [selectedColor, setSelectedColor] = useState(editSession?.color || SUBJECT_COLORS[0]);

  useEffect(() => {
    if (editSession) {
      const time = hoursToHoursMinutes(editSession.targetHours);
      setSubject(editSession.subject);
      setTargetHours(time.hours);
      setTargetMinutes(time.minutes);
      setTargetTests(editSession.targetTests.toString());
      setNotes(editSession.notes);
      setSelectedColor(editSession.color);
    }
  }, [editSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const totalHours = hoursMinutesToHours(targetHours, targetMinutes);

    onAdd({
      subject: subject.trim(),
      targetHours: totalHours,
      targetTests: parseInt(targetTests) || 0,
      actualHours: editSession?.actualHours || 0,
      actualTests: editSession?.actualTests || 0,
      completed: editSession?.completed || false,
      completionPercent: editSession?.completionPercent || 0,
      notes,
      color: selectedColor,
    });

    // Reset form
    setSubject('');
    setTargetHours(1);
    setTargetMinutes(30);
    setTargetTests('10');
    setNotes('');
    setSelectedColor(SUBJECT_COLORS[0]);
    onClose();
  };

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
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">
              {editSession ? 'ویرایش جلسه' : 'جلسه جدید'}
            </h2>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label>موضوع درس</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="نام درس را وارد کنید"
              className="bg-muted/50 border-white/10"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    subject === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>رنگ</Label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Target Hours & Tests */}
          <div className="grid grid-cols-2 gap-4">
            <TimeInput
              hours={targetHours}
              minutes={targetMinutes}
              onHoursChange={setTargetHours}
              onMinutesChange={setTargetMinutes}
              label="ساعت هدف"
            />
            <div className="space-y-2">
              <Label>تعداد تست هدف</Label>
              <Input
                type="number"
                min="0"
                value={targetTests}
                onChange={(e) => setTargetTests(e.target.value)}
                className="bg-muted/50 border-white/10"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>یادداشت (اختیاری)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت برای این جلسه..."
              className="bg-muted/50 border-white/10 resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 ml-2" />
            {editSession ? 'ذخیره تغییرات' : 'افزودن جلسه'}
          </Button>
        </form>
      </div>
    </div>
  );
};
