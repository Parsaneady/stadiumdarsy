import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, Sun, Play, Square, Timer, Clock, Coffee, Settings } from 'lucide-react';
import { useStudyStore, StudySession } from '@/stores/studyStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { DayClockCircle } from '@/components/study/DayClockCircle';
import { PensionMembersStatus } from '@/components/study/PensionMembersStatus';
import { StudyModeSelector } from '@/components/study/StudyModeSelector';
import { toast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Activity {
  id: string;
  type: 'sleep' | 'study' | 'break' | 'free_time';
  subject?: string;
  color?: string;
  startHour: number;
  endHour: number;
}

interface StudyMarker {
  hour: number;
  type: 'start' | 'end';
  subject?: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  'ریاضی': '#F97316',
  'فیزیک': '#3B82F6', 
  'شیمی': '#10B981',
  'زیست': '#8B5CF6',
  'ادبیات': '#EC4899',
  'عربی': '#EAB308',
  'زبان': '#06B6D4',
  'دینی': '#84CC16',
};

const DailyLog = () => {
  const { user } = useAuth();
  const { weeklyPlan, initializeWeek, getTodayIndex, pomodoroSettings, setPomodoroSettings } = useStudyStore();
  const { 
    mode, timeLeft, isRunning, currentCycle, pomodoroSubject,
    setMode, setTimeLeft, setIsRunning, setCurrentCycle, 
    incrementCycle, setPomodoroSubject, decrementTime
  } = usePomodoroStore();
  const { saveWeeklyPlan, addPomodoroSession } = useCloudSync();

  // State
  const [wakeUpTime, setWakeUpTime] = useState<number | null>(null);
  const [wakeUpDialogOpen, setWakeUpDialogOpen] = useState(false);
  const [wakeUpInput, setWakeUpInput] = useState('07:00');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [studyMarkers, setStudyMarkers] = useState<StudyMarker[]>([]);
  const [studyModeOpen, setStudyModeOpen] = useState(false);
  const [pomodoroSettingsOpen, setPomodoroSettingsOpen] = useState(false);
  const [currentStudySession, setCurrentStudySession] = useState<{
    subject: string;
    mode: 'pomodoro' | 'free';
    startTime: Date;
  } | null>(null);
  const [freeTimeElapsed, setFreeTimeElapsed] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize week if needed
  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  // Load today's wake-up time and activities from database
  useEffect(() => {
    if (!user) return;

    const loadTodayData = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check wake-up log
      const { data: wakeUpData } = await supabase
        .from('wake_up_logs')
        .select('wake_time')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .maybeSingle();

      if (wakeUpData) {
        const [hours] = wakeUpData.wake_time.split(':').map(Number);
        setWakeUpTime(hours);
      }

      // Load activities
      const { data: activitiesData } = await supabase
        .from('study_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .order('start_time');

      if (activitiesData) {
        const mapped: Activity[] = activitiesData.map(a => ({
          id: a.id,
          type: a.activity_type as Activity['type'],
          subject: a.subject || undefined,
          color: a.color || undefined,
          startHour: parseInt(a.start_time.split(':')[0]) + parseInt(a.start_time.split(':')[1]) / 60,
          endHour: a.end_time 
            ? parseInt(a.end_time.split(':')[0]) + parseInt(a.end_time.split(':')[1]) / 60
            : new Date().getHours() + new Date().getMinutes() / 60,
        }));
        setActivities(mapped);
        
        // Build study markers from activities
        const markers: StudyMarker[] = [];
        activitiesData.forEach(a => {
          if (a.activity_type === 'study') {
            const startH = parseInt(a.start_time.split(':')[0]) + parseInt(a.start_time.split(':')[1]) / 60;
            markers.push({ hour: startH, type: 'start', subject: a.subject || undefined });
            if (a.end_time) {
              const endH = parseInt(a.end_time.split(':')[0]) + parseInt(a.end_time.split(':')[1]) / 60;
              markers.push({ hour: endH, type: 'end', subject: a.subject || undefined });
            }
          }
        });
        setStudyMarkers(markers);
      }

      // Check if currently studying
      const { data: statusData } = await supabase
        .from('user_study_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statusData?.is_studying && statusData.started_at) {
        setCurrentStudySession({
          subject: statusData.current_subject || '',
          mode: (statusData.study_mode || 'free') as 'pomodoro' | 'free',
          startTime: new Date(statusData.started_at),
        });
      }
    };

    loadTodayData();
  }, [user]);

  // Get available subjects from today's plan with their colors
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan[todayIndex];
  const availableSubjects = todayPlan?.sessions.map(s => s.subject) || [];
  
  // Build subject colors map from weekly plan
  const subjectColorsFromPlan: Record<string, string> = {};
  todayPlan?.sessions.forEach(s => {
    if (s.subject && s.color) {
      subjectColorsFromPlan[s.subject] = s.color;
    }
  });
  const handleWakeUp = async () => {
    if (!user) return;
    
    const [hours, minutes] = wakeUpInput.split(':').map(Number);
    const wakeHour = hours + minutes / 60;
    
    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Get user's pension
    const { data: memberData } = await supabase
      .from('pension_members')
      .select('pension_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberData) {
      await supabase.from('wake_up_logs').upsert({
        user_id: user.id,
        pension_id: memberData.pension_id,
        wake_time: timeStr,
        logged_date: today,
      }, { onConflict: 'user_id,logged_date' });
    }

    setWakeUpTime(wakeHour);
    setWakeUpDialogOpen(false);
    
    toast({
      title: '☀️ بیداری ثبت شد',
      description: `ساعت بیداری: ${wakeUpInput}`,
    });
  };

  // Start study session
  const startStudy = async (subject: string, studyMode: 'pomodoro' | 'free') => {
    if (!user) return;
    
    const now = new Date();
    
    // Update user study status
    await supabase.from('user_study_status').upsert({
      user_id: user.id,
      is_studying: true,
      current_subject: subject,
      study_mode: studyMode,
      started_at: now.toISOString(),
      last_active: now.toISOString(),
    }, { onConflict: 'user_id' });

    // Create activity record
    const today = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    await supabase.from('study_activities').insert({
      user_id: user.id,
      activity_date: today,
      activity_type: 'study',
      subject,
      color: SUBJECT_COLORS[subject] || '#8B5CF6',
      start_time: timeStr,
      is_active: true,
      study_mode: studyMode,
    });

    setCurrentStudySession({
      subject,
      mode: studyMode,
      startTime: now,
    });
    
    // Add start marker
    const startHour = now.getHours() + now.getMinutes() / 60;
    setStudyMarkers(prev => [...prev, { hour: startHour, type: 'start', subject }]);

    if (studyMode === 'pomodoro') {
      setPomodoroSubject(subject);
      setMode('study');
      setTimeLeft(pomodoroSettings.studyDuration * 60);
      setIsRunning(true);
    } else {
      setFreeTimeElapsed(0);
    }

    toast({
      title: '📚 شروع مطالعه',
      description: `${subject} - ${studyMode === 'pomodoro' ? 'پومودورو' : 'تایم آزاد'}`,
    });
  };

  // Stop study session
  const stopStudy = async () => {
    if (!user || !currentStudySession) return;

    const now = new Date();
    
    // Update user status
    await supabase.from('user_study_status').update({
      is_studying: false,
      current_subject: null,
      study_mode: null,
      started_at: null,
      last_active: now.toISOString(),
    }).eq('user_id', user.id);

    // Update activity end time
    const today = now.toISOString().split('T')[0];
    const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    await supabase.from('study_activities').update({
      end_time: endTimeStr,
      is_active: false,
    })
    .eq('user_id', user.id)
    .eq('activity_date', today)
    .eq('is_active', true);

    // Calculate duration
    const durationMinutes = Math.floor((now.getTime() - currentStudySession.startTime.getTime()) / 60000);
    
    if (currentStudySession.mode === 'free' && durationMinutes > 0) {
      // Save to pomodoro sessions for stats
      await addPomodoroSession(currentStudySession.subject, durationMinutes);
    }

    setCurrentStudySession(null);
    setIsRunning(false);
    setPomodoroSubject(null);
    setFreeTimeElapsed(0);

    // Refresh activities
    const { data: activitiesData } = await supabase
      .from('study_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_date', today)
      .order('start_time');

    if (activitiesData) {
      const mapped: Activity[] = activitiesData.map(a => ({
        id: a.id,
        type: a.activity_type as Activity['type'],
        subject: a.subject || undefined,
        color: a.color || undefined,
        startHour: parseInt(a.start_time.split(':')[0]) + parseInt(a.start_time.split(':')[1]) / 60,
        endHour: a.end_time 
          ? parseInt(a.end_time.split(':')[0]) + parseInt(a.end_time.split(':')[1]) / 60
          : now.getHours() + now.getMinutes() / 60,
      }));
      setActivities(mapped);
      
      // Update study markers
      const markers: StudyMarker[] = [];
      activitiesData.forEach(a => {
        if (a.activity_type === 'study') {
          const startH = parseInt(a.start_time.split(':')[0]) + parseInt(a.start_time.split(':')[1]) / 60;
          markers.push({ hour: startH, type: 'start', subject: a.subject || undefined });
          if (a.end_time) {
            const endH = parseInt(a.end_time.split(':')[0]) + parseInt(a.end_time.split(':')[1]) / 60;
            markers.push({ hour: endH, type: 'end', subject: a.subject || undefined });
          }
        }
      });
      setStudyMarkers(markers);
    }

    toast({
      title: '✅ پایان مطالعه',
      description: `${currentStudySession.subject} - ${durationMinutes} دقیقه`,
    });
  };

  // Pomodoro timer effect
  useEffect(() => {
    if (!isRunning || currentStudySession?.mode !== 'pomodoro') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const state = usePomodoroStore.getState();
      
      if (state.timeLeft > 0) {
        state.decrementTime();
      } else {
        // Timer finished
        if (state.mode === 'study') {
          // Save pomodoro session
          if (currentStudySession) {
            addPomodoroSession(currentStudySession.subject, pomodoroSettings.studyDuration);
          }
          
          toast({
            title: '🎉 پومودورو تمام شد!',
            description: 'زمان استراحت!',
          });

          if (currentCycle >= pomodoroSettings.cycles) {
            state.setMode('longBreak');
            state.setTimeLeft(pomodoroSettings.longBreak * 60);
            state.setCurrentCycle(1);
          } else {
            state.setMode('shortBreak');
            state.setTimeLeft(pomodoroSettings.shortBreak * 60);
            state.incrementCycle();
          }
        } else {
          // Break finished
          toast({
            title: '⏰ استراحت تمام شد!',
            description: 'ادامه مطالعه...',
          });
          state.setMode('study');
          state.setTimeLeft(pomodoroSettings.studyDuration * 60);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentStudySession, pomodoroSettings, currentCycle, addPomodoroSession]);

  // Free time counter
  useEffect(() => {
    if (!currentStudySession || currentStudySession.mode !== 'free') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentStudySession.startTime.getTime()) / 1000);
      setFreeTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStudySession]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">ثبت روزانه</h1>
            <p className="text-muted-foreground mt-1">
              {todayPlan?.dayName || 'امروز'} - ساعت فعالیت‌های شما
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clock Circle Section */}
          <GlassCard delay={0}>
            <div className="flex flex-col items-center">
              {/* Wake-up section */}
              {wakeUpTime === null ? (
                <div className="w-full mb-6">
                  <div className="text-center p-6 rounded-xl bg-warning/10 border border-warning/30">
                    <Sun className="w-10 h-10 mx-auto mb-3 text-warning" />
                    <h3 className="font-semibold mb-2">ابتدا ساعت بیداری را ثبت کنید</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      برای شروع ثبت فعالیت‌ها، ساعت بیداری خود را وارد کنید
                    </p>
                    <Button 
                      onClick={() => setWakeUpDialogOpen(true)}
                      className="bg-gradient-to-r from-warning to-accent"
                    >
                      <Sun className="w-4 h-4 ml-2" />
                      ثبت بیداری
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Clock Circle */}
                  <DayClockCircle 
                    activities={activities}
                    wakeUpHour={wakeUpTime}
                    size={320}
                    subjectColors={subjectColorsFromPlan}
                    studyMarkers={studyMarkers}
                  />

                  {/* Study Controls */}
                  <div className="w-full mt-6 space-y-4">
                    {currentStudySession ? (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">در حال مطالعه</p>
                            <p className="font-semibold text-lg">{currentStudySession.subject}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-sm text-muted-foreground">
                              {currentStudySession.mode === 'pomodoro' ? 'پومودورو' : 'تایم آزاد'}
                            </p>
                            <p className="font-mono text-2xl font-bold text-primary">
                              {currentStudySession.mode === 'pomodoro' 
                                ? formatTime(timeLeft)
                                : formatTime(freeTimeElapsed)
                              }
                            </p>
                          </div>
                        </div>

                        {currentStudySession.mode === 'pomodoro' && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            {mode === 'study' ? (
                              <Timer className="w-4 h-4 text-primary" />
                            ) : (
                              <Coffee className="w-4 h-4 text-success" />
                            )}
                            <span>
                              {mode === 'study' 
                                ? `مطالعه - سیکل ${currentCycle}/${pomodoroSettings.cycles}`
                                : mode === 'shortBreak' ? 'استراحت کوتاه' : 'استراحت بلند'
                              }
                            </span>
                          </div>
                        )}

                        <Button
                          onClick={stopStudy}
                          variant="destructive"
                          className="w-full"
                        >
                          <Square className="w-4 h-4 ml-2" />
                          پایان مطالعه
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={() => setStudyModeOpen(true)}
                          className="w-full bg-gradient-to-r from-primary to-accent py-6 text-lg"
                          disabled={availableSubjects.length === 0}
                        >
                          <Play className="w-5 h-5 ml-2" />
                          شروع مطالعه
                        </Button>
                        <Button
                          onClick={() => setPomodoroSettingsOpen(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Settings className="w-4 h-4 ml-2" />
                          تنظیمات پومودورو
                        </Button>
                      </div>
                    )}

                    {availableSubjects.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        ابتدا در برنامه هفتگی درس اضافه کنید
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Right column */}
          <div className="space-y-6">
            {/* Today's Legend */}
            {activities.length > 0 && (
              <GlassCard delay={1}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  فعالیت‌های امروز
                </h3>
                <div className="space-y-2">
                  {activities.map((act) => {
                    const duration = act.endHour - act.startHour;
                    return (
                      <div 
                        key={act.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                      >
                        <div 
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: act.color || 'hsl(var(--muted))' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {act.subject || (act.type === 'sleep' ? 'خواب' : act.type)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(act.startHour)}:{String(Math.round((act.startHour % 1) * 60)).padStart(2, '0')}
                          {' - '}
                          {Math.floor(act.endHour)}:{String(Math.round((act.endHour % 1) * 60)).padStart(2, '0')}
                        </p>
                        <p className="text-xs font-medium text-primary">
                          {duration.toFixed(1)} ساعت
                        </p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Pension Members */}
            <PensionMembersStatus />
          </div>
        </div>

        {/* Wake-up Dialog */}
        <Dialog open={wakeUpDialogOpen} onOpenChange={setWakeUpDialogOpen}>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-warning" />
                ثبت ساعت بیداری
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                ساعت بیداری امروز را وارد کنید:
              </p>
              <Input
                type="time"
                value={wakeUpInput}
                onChange={(e) => setWakeUpInput(e.target.value)}
                className="text-center text-2xl py-6"
              />
              <Button 
                onClick={handleWakeUp}
                className="w-full bg-gradient-to-r from-warning to-accent"
              >
                ثبت بیداری
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Study Mode Selector */}
        <StudyModeSelector
          open={studyModeOpen}
          onClose={() => setStudyModeOpen(false)}
          subjects={availableSubjects}
          onSelectPomodoro={(subject) => startStudy(subject, 'pomodoro')}
          onSelectFreeTime={(subject) => startStudy(subject, 'free')}
        />

        {/* Pomodoro Settings Dialog */}
        <Dialog open={pomodoroSettingsOpen} onOpenChange={setPomodoroSettingsOpen}>
          <DialogContent className="glass-card border-white/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                تنظیمات پومودورو
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <Label className="flex justify-between">
                  <span>مدت مطالعه</span>
                  <span className="text-primary font-mono">{pomodoroSettings.studyDuration} دقیقه</span>
                </Label>
                <Slider
                  value={[pomodoroSettings.studyDuration]}
                  onValueChange={([val]) => setPomodoroSettings({ ...pomodoroSettings, studyDuration: val })}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="flex justify-between">
                  <span>استراحت کوتاه</span>
                  <span className="text-success font-mono">{pomodoroSettings.shortBreak} دقیقه</span>
                </Label>
                <Slider
                  value={[pomodoroSettings.shortBreak]}
                  onValueChange={([val]) => setPomodoroSettings({ ...pomodoroSettings, shortBreak: val })}
                  min={1}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="flex justify-between">
                  <span>استراحت بلند</span>
                  <span className="text-accent font-mono">{pomodoroSettings.longBreak} دقیقه</span>
                </Label>
                <Slider
                  value={[pomodoroSettings.longBreak]}
                  onValueChange={([val]) => setPomodoroSettings({ ...pomodoroSettings, longBreak: val })}
                  min={5}
                  max={30}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="flex justify-between">
                  <span>تعداد سیکل</span>
                  <span className="text-warning font-mono">{pomodoroSettings.cycles} سیکل</span>
                </Label>
                <Slider
                  value={[pomodoroSettings.cycles]}
                  onValueChange={([val]) => setPomodoroSettings({ ...pomodoroSettings, cycles: val })}
                  min={1}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={() => setPomodoroSettingsOpen(false)}
                className="w-full"
              >
                ذخیره تنظیمات
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DailyLog;