import { useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Settings, Volume2, VolumeX, Bell, Calendar, Clock } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

// Web Audio API alarm sound generator - created once
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const createAlarmSound = () => {
  try {
    const ctx = getAudioContext();
    
    const playBeep = (frequency: number, duration: number, delay: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const startTime = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    playBeep(800, 0.15, 0);
    playBeep(800, 0.15, 0.2);
    playBeep(1000, 0.15, 0.4);
    playBeep(1000, 0.15, 0.6);
    playBeep(800, 0.3, 0.8);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// Memoized timer display component
const TimerDisplay = memo(({ timeLeft, progress, modeColor, modeLabel }: {
  timeLeft: number;
  progress: number;
  modeColor: string;
  modeLabel: string;
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Use CSS transform for GPU-accelerated animation
  const strokeDashoffset = 2 * Math.PI * 120 * (1 - progress / 100);

  return (
    <div className="relative w-64 h-64">
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
          className={`fill-none stroke-current ${modeColor}`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 120}
          strokeDashoffset={strokeDashoffset}
          style={{ 
            transition: 'stroke-dashoffset 0.3s ease',
            willChange: 'stroke-dashoffset'
          }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums">
          {formatTime(timeLeft)}
        </span>
        <span className="text-sm text-muted-foreground mt-2">{modeLabel}</span>
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

const Pomodoro = () => {
  const { 
    pomodoroSettings, 
    setPomodoroSettings, 
    addPomodoroTime, 
    totalPomodoroMinutesToday,
    weeklyPlan,
    getTodayIndex,
    initializeWeek,
    getTodayPomodoros,
    getWeeklyPomodoroCount,
  } = useStudyStore();
  
  const {
    mode,
    timeLeft,
    isRunning,
    currentCycle,
    completedPomodoros,
    pomodoroSubject,
    setMode,
    setTimeLeft,
    decrementTime,
    setIsRunning,
    setCurrentCycle,
    incrementCycle,
    incrementCompletedPomodoros,
    setPomodoroSubject,
    resetTimer,
  } = usePomodoroStore();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(pomodoroSettings);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get available subjects from today's plan
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];
  const availableSubjects = useMemo(() => 
    todayPlan?.sessions.map(s => s.subject) || [], 
    [todayPlan]
  );

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  const playAlarm = useCallback(() => {
    if (soundEnabled) {
      createAlarmSound();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('پومودورو', {
          body: mode === 'study' ? '🎉 تبریک! زمان استراحت است!' : '⏰ زمان مطالعه است!',
          icon: '🍅',
        });
      }
    }
  }, [soundEnabled, mode]);

  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'study': return pomodoroSettings.studyDuration * 60;
      case 'shortBreak': return pomodoroSettings.shortBreak * 60;
      case 'longBreak': return pomodoroSettings.longBreak * 60;
    }
  }, [pomodoroSettings]);

  // Timer effect with requestAnimationFrame optimization
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playAlarm();
      
      if (mode === 'study' && pomodoroSubject) {
        addPomodoroTime(pomodoroSettings.studyDuration, pomodoroSubject);
        incrementCompletedPomodoros();
        
        toast({
          title: "🎉 تبریک!",
          description: `یک پومودورو برای ${pomodoroSubject} تکمیل شد!`,
        });
        
        if (currentCycle >= pomodoroSettings.cycles) {
          setMode('longBreak');
          setTimeLeft(pomodoroSettings.longBreak * 60);
          setCurrentCycle(1);
        } else {
          setMode('shortBreak');
          setTimeLeft(pomodoroSettings.shortBreak * 60);
          incrementCycle();
        }
      } else {
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
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, currentCycle, pomodoroSettings, addPomodoroTime, playAlarm, pomodoroSubject, decrementTime, incrementCompletedPomodoros, incrementCycle, setCurrentCycle, setIsRunning, setMode, setTimeLeft]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStartClick = useCallback(() => {
    if (mode === 'study' && !pomodoroSubject && availableSubjects.length > 0) {
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
  }, [mode, pomodoroSubject, availableSubjects.length, isRunning, setIsRunning]);

  const startWithSubject = useCallback((subject: string) => {
    setPomodoroSubject(subject);
    setSubjectSelectOpen(false);
    setIsRunning(true);
  }, [setPomodoroSubject, setIsRunning]);

  const handleResetTimer = useCallback(() => {
    resetTimer(getDuration(mode));
    setPomodoroSubject(null);
  }, [resetTimer, getDuration, mode, setPomodoroSubject]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
    if (newMode !== 'study') {
      setPomodoroSubject(null);
    }
  }, [setMode, setTimeLeft, getDuration, setIsRunning, setPomodoroSubject]);

  const saveSettings = useCallback(() => {
    setPomodoroSettings(tempSettings);
    setTimeLeft(tempSettings.studyDuration * 60);
    setMode('study');
    setIsRunning(false);
    setSettingsOpen(false);
    toast({
      title: "✅ تنظیمات ذخیره شد",
      description: "تنظیمات پومودورو با موفقیت به‌روزرسانی شد.",
    });
  }, [tempSettings, setPomodoroSettings, setTimeLeft, setMode, setIsRunning]);

  const testAlarm = useCallback(() => {
    createAlarmSound();
    toast({
      title: "🔔 تست زنگ",
      description: "صدای زنگ تست شد!",
    });
  }, []);

  const progress = useMemo(() => 
    ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100,
    [getDuration, mode, timeLeft]
  );

  const modeColor = useMemo(() => {
    switch (mode) {
      case 'study': return 'text-primary';
      case 'shortBreak': return 'text-success';
      case 'longBreak': return 'text-warning';
    }
  }, [mode]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 'study': return pomodoroSubject ? `مطالعه: ${pomodoroSubject}` : 'زمان مطالعه';
      case 'shortBreak': return 'استراحت کوتاه';
      case 'longBreak': return 'استراحت بلند';
    }
  }, [mode, pomodoroSubject]);

  const buttonGradient = useMemo(() => {
    switch (mode) {
      case 'study': return 'from-primary to-accent';
      case 'shortBreak': return 'from-success to-secondary';
      case 'longBreak': return 'from-warning to-accent';
    }
  }, [mode]);

  return (
    <AppLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
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
            onClick={testAlarm}
            className="glass-button"
            title="تست زنگ"
          >
            <Bell className="w-5 h-5" />
          </Button>
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
      </div>

      {/* Stats Bar */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-around animate-fade-in">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{getTodayPomodoros().length}</p>
          <p className="text-sm text-muted-foreground">پومودورو امروز</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{Math.floor(totalPomodoroMinutesToday)}</p>
          <p className="text-sm text-muted-foreground">دقیقه مطالعه</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{getWeeklyPomodoroCount()}</p>
          <p className="text-sm text-muted-foreground">پومودورو هفته</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{currentCycle}/{pomodoroSettings.cycles}</p>
          <p className="text-sm text-muted-foreground">سیکل فعلی</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-3 animate-fade-in">
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
      </div>

      {/* Timer Display */}
      <GlassCard delay={0.1} className="flex flex-col items-center py-12">
        <TimerDisplay 
          timeLeft={timeLeft}
          progress={progress}
          modeColor={modeColor}
          modeLabel={modeLabel}
        />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            size="lg"
            variant="outline"
            onClick={handleResetTimer}
            className="glass-button w-14 h-14 rounded-full"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
          
          <Button
            size="lg"
            onClick={isRunning ? () => setIsRunning(false) : handleStartClick}
            className={`w-20 h-20 rounded-full bg-gradient-to-r ${buttonGradient} hover:opacity-90 shadow-lg`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 mr-1" />}
          </Button>
          
          <div className="w-14 h-14" />
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

      {/* Today's Pomodoro History */}
      {getTodayPomodoros().length > 0 && (
        <GlassCard delay={0.2}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">پومودوروهای امروز</h3>
          </div>
          <div className="space-y-2">
            {getTodayPomodoros().map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{session.subject}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{session.minutes} دقیقه</span>
                  <span>
                    {new Date(session.completedAt).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Tips */}
      <GlassCard delay={0.3}>
        <h3 className="text-lg font-semibold mb-4">💡 نکات پومودورو</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• هر پومودورو ۲۵ دقیقه تمرکز کامل روی یک کار است</li>
          <li>• بعد از هر پومودورو، ۵ دقیقه استراحت کوتاه داشته باشید</li>
          <li>• بعد از ۴ پومودورو، یک استراحت بلند ۱۵-۲۰ دقیقه‌ای داشته باشید</li>
          <li>• در زمان استراحت از صفحه نمایش فاصله بگیرید</li>
        </ul>
      </GlassCard>
    </div>
    </AppLayout>
  );
};

export default Pomodoro;
