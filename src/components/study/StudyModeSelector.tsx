import { Timer, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StudyModeSelectorProps {
  open: boolean;
  onClose: () => void;
  subjects: string[];
  onSelectPomodoro: (subject: string) => void;
  onSelectFreeTime: (subject: string) => void;
}

export const StudyModeSelector = ({
  open,
  onClose,
  subjects,
  onSelectPomodoro,
  onSelectFreeTime,
}: StudyModeSelectorProps) => {
  const handleSelect = (mode: 'pomodoro' | 'free', subject: string) => {
    if (mode === 'pomodoro') {
      onSelectPomodoro(subject);
    } else {
      onSelectFreeTime(subject);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-card border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            شروع مطالعه
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              ابتدا در برنامه هفتگی درس اضافه کنید
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                درس خود را انتخاب کنید:
              </p>
              
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div 
                    key={subject}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <p className="font-medium mb-3">{subject}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'flex-1 gap-2',
                          'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        )}
                        onClick={() => handleSelect('pomodoro', subject)}
                      >
                        <Timer className="w-4 h-4" />
                        پومودورو
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'flex-1 gap-2',
                          'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
                        )}
                        onClick={() => handleSelect('free', subject)}
                      >
                        <Clock className="w-4 h-4" />
                        تایم آزاد
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};