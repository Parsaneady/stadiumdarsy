import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Settings, Volume2, VolumeX } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

const Pomodoro = () => {
  const { 
    pomodoroSettings, 
    setPomodoroSettings, 
    addPomodoroTime, 
    totalPomodoroMinutesToday,
    weeklyPlan,
    getTodayIndex,
    pomodoroSubject,
    setPomodoroSubject,
    initializeWeek,
  } = useStudyStore();
  
  const [mode, setMode] = useState<TimerMode>('study');
  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);
  
  const [tempSettings, setTempSettings] = useState(pomodoroSettings);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get available subjects from today's plan
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];
  const availableSubjects = todayPlan?.sessions.map(s => s.subject) || [];

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleF0cN3G58u2YWhomYp7e7ap4QhYgWprk7a95OxEdVZnn7rJ8NQ8YUJfp77R+MA0TSpTr8LWALAsOS5Ls8LaAKwkMR5Pu8biCKQgKRJLw8rmDJwcIQpHy87uFJQYGQI/08r2HJAUFPo728L+IJQUEPIv48cCJJgQDOon68sKLKAQCOIf88sSNKQMBNob+88aPKwIANIT/9MiRLQEAMoP/9cqTLwAAMIH/9syVMQAALn//986XNAAAK33/+dCaNgAAKXv/+tKcOAAAJ3n/+9SePAAAJXf//NagPgAAI3X//diiQAAAIXP//tqlQgAAH3H//9unRAAAHW///9ypRgAAG23//92rSAAAGWv//9+tSgAAF2n//+CvTAAAFWf//+KxTgAAE2X//+SzUAAAEWP//+W1UgAAD2H//+e3VAAADV///+m5VgAAC13//+u7WAAACVT');
  }, []);

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'study': return pomodoroSettings.studyDuration * 60;
      case 'shortBreak': return pomodoroSettings.shortBreak * 60;
      case 'longBreak': return pomodoroSettings.longBreak * 60;
    }
  }, [pomodoroSettings]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playSound();
      
      if (mode === 'study' && pomodoroSubject) {
        // Completed a study session
        addPomodoroTime(pomodoroSettings.studyDuration, pomodoroSubject);
        setCompletedPomodoros((prev) => prev + 1);
        
        toast({
          title: "🎉 تبریک!",
          description: `یک پومودورو برای ${pomodoroSubject} تکمیل شد!`,
        });
        
        // Determine next break type
        if (currentCycle >= pomodoroSettings.cycles) {
          setMode('longBreak');
          setTimeLeft(pomodoroSettings.longBreak * 60);
          setCurrentCycle(1);
        } else {
          setMode('shortBreak');
          setTimeLeft(pomodoroSettings.shortBreak * 60);
          setCurrentCycle((prev) => prev + 1);
        }
      } else {
        // Break finished, back to study
        setMode('study');
        setTimeLeft(pomodoroSettings.studyDuration * 60);
        toast({
          title: "⏰ استراحت تمام شد!",
          description: "وقت مطالعه است!",
        });
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, currentCycle, pomodoroSettings, addPomodoroTime, playSound, pomodoroSubject]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartClick = () => {
    if (mode === 'study' && !pomodoroSubject && availableSubjects.length > 0) {
      // Show subject selection dialog
      setSubjectSelectOpen(true);
    } else if (mode === 'study' && availableSubjects.length === 0) {
      toast({
        title: "⚠️ هیچ درسی تعریف نشده",
        description: "ابتدا در برنامه هفتگی درس اضافه کنید.",
        variant: "destructive",
      });
    } else {
      setIsRunning(!isRunning);
    }
  };

  const startWithSubject = (subject: string) => {
    setPomodoroSubject(subject);
    setSubjectSelectOpen(false);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
    setPomodoroSubject(null);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
    if (newMode !== 'study') {
      setPomodoroSubject(null);
    }
  };

  const saveSettings = () => {
    setPomodoroSettings(tempSettings);
    setTimeLeft(tempSettings.studyDuration * 60);
    setMode('study');
    setIsRunning(false);
    setSettingsOpen(false);
    toast({
      title: "✅ تنظیمات ذخیره شد",
      description: "تنظیمات پومودورو با موفقیت به‌روزرسانی شد.",
    });
  };

  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;

  const getModeColor = () => {
    switch (mode) {
      case 'study': return 'text-primary';
      case 'shortBreak': return 'text-success';
      case 'longBreak': return 'text-warning';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'study': return pomodoroSubject ? `مطالعه: ${pomodoroSubject}` : 'زمان مطالعه';
      case 'shortBreak': return 'استراحت کوتاه';
      case 'longBreak': return 'استراحت بلند';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Timer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">تایمر پومودورو</h1>
            <p className="text-muted-foreground mt-1">تکنیک مدیریت زمان برای تمرکز بهتر</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="glass-button"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="glass-button">
                <Settings className="w-4 h-4 ml-2" />
                تنظیمات
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/20">
              <DialogHeader>
                <DialogTitle className="text-xl">تنظیمات پومودورو</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>مدت زمان مطالعه (دقیقه)</Label>
                  <Input
                    type="number"
                    value={tempSettings.studyDuration}
                    onChange={(e) => setTempSettings({ ...tempSettings, studyDuration: Number(e.target.value) })}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>استراحت کوتاه (دقیقه)</Label>
                  <Input
                    type="number"
                    value={tempSettings.shortBreak}
                    onChange={(e) => setTempSettings({ ...tempSettings, shortBreak: Number(e.target.value) })}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>استراحت بلند (دقیقه)</Label>
                  <Input
                    type="number"
                    value={tempSettings.longBreak}
                    onChange={(e) => setTempSettings({ ...tempSettings, longBreak: Number(e.target.value) })}
                    className="glass-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تعداد سیکل</Label>
                  <Input
                    type="number"
                    value={tempSettings.cycles}
                    onChange={(e) => setTempSettings({ ...tempSettings, cycles: Number(e.target.value) })}
                    className="glass-input"
                  />
                </div>
                <Button onClick={saveSettings} className="w-full bg-gradient-to-r from-primary to-accent">
                  ذخیره تنظیمات
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 flex items-center justify-around"
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{completedPomodoros}</p>
          <p className="text-sm text-muted-foreground">پومودورو امروز</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{Math.floor(totalPomodoroMinutesToday)}</p>
          <p className="text-sm text-muted-foreground">دقیقه مطالعه</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{currentCycle}/{pomodoroSettings.cycles}</p>
          <p className="text-sm text-muted-foreground">سیکل فعلی</p>
        </div>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-3"
      >
        <Button
          variant={mode === 'study' ? 'default' : 'outline'}
          onClick={() => switchMode('study')}
          className={mode === 'study' ? 'bg-gradient-to-r from-primary to-accent' : 'glass-button'}
        >
          <Brain className="w-4 h-4 ml-2" />
          مطالعه
        </Button>
        <Button
          variant={mode === 'shortBreak' ? 'default' : 'outline'}
          onClick={() => switchMode('shortBreak')}
          className={mode === 'shortBreak' ? 'bg-gradient-to-r from-success to-secondary' : 'glass-button'}
        >
          <Coffee className="w-4 h-4 ml-2" />
          استراحت کوتاه
        </Button>
        <Button
          variant={mode === 'longBreak' ? 'default' : 'outline'}
          onClick={() => switchMode('longBreak')}
          className={mode === 'longBreak' ? 'bg-gradient-to-r from-warning to-accent' : 'glass-button'}
        >
          <Coffee className="w-4 h-4 ml-2" />
          استراحت بلند
        </Button>
      </motion.div>

      {/* Timer Display */}
      <GlassCard delay={0.3} className="flex flex-col items-center py-12">
        <div className="relative w-64 h-64">
          {/* Simple circular progress */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              className="stroke-muted/20 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              className={`fill-none stroke-current ${getModeColor()}`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          
          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">{getModeLabel()}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            size="lg"
            variant="outline"
            onClick={resetTimer}
            className="glass-button w-14 h-14 rounded-full"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
          
          <Button
            size="lg"
            onClick={isRunning ? () => setIsRunning(false) : handleStartClick}
            className={`w-20 h-20 rounded-full bg-gradient-to-r ${
              mode === 'study' ? 'from-primary to-accent' :
              mode === 'shortBreak' ? 'from-success to-secondary' : 'from-warning to-accent'
            } hover:opacity-90 shadow-lg`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 mr-1" />}
          </Button>
          
          <div className="w-14 h-14" /> {/* Spacer for symmetry */}
        </div>
      </GlassCard>

      {/* Subject Selection Dialog */}
      <Dialog open={subjectSelectOpen} onOpenChange={setSubjectSelectOpen}>
        <DialogContent className="glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl">انتخاب درس</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground">برای کدام درس می‌خواهید مطالعه کنید؟</p>
            <div className="space-y-2">
              {availableSubjects.map((subject) => (
                <Button
                  key={subject}
                  variant="outline"
                  className="w-full justify-start glass-button"
                  onClick={() => startWithSubject(subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <GlassCard delay={0.4}>
        <h3 className="text-lg font-semibold mb-4">💡 نکات پومودورو</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• هر پومودورو ۲۵ دقیقه تمرکز کامل روی یک کار است</li>
          <li>• بعد از هر پومودورو، ۵ دقیقه استراحت کوتاه داشته باشید</li>
          <li>• بعد از ۴ پومودورو، یک استراحت بلند ۱۵-۲۰ دقیقه‌ای داشته باشید</li>
          <li>• در زمان استراحت از صفحه نمایش فاصله بگیرید</li>
        </ul>
      </GlassCard>
    </div>
  );
};

export default Pomodoro;
