import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, Sun, Play, Square, Timer, Clock, Coffee, Settings, Target } from 'lucide-react';
import { getEffectiveDateString } from '@/lib/timeUtils';
import { useStudyStore, StudySession, DailyLog as DailyLogType, DailyLogSession } from '@/stores/studyStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { DayClockCircle } from '@/components/study/DayClockCircle';
import { PensionMembersStatus } from '@/components/study/PensionMembersStatus';
import { PensionMembersStudyTime } from '@/components/study/PensionMembersStudyTime';
import { StudyModeSelector } from '@/components/study/StudyModeSelector';
import { toast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/AppLayout';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAuth } from '@/contexts/AuthContext';
import { usePomodoroSound } from '@/hooks/usePomodoroSound';
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
  color?: string;
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
  const { weeklyPlan, initializeWeek, getTodayIndex, pomodoroSettings, setPomodoroSettings, updateSession, dailyLogs, setDailyLogs } = useStudyStore();
  const { 
    mode, timeLeft, isRunning, currentCycle, pomodoroSubject,
    setMode, setTimeLeft, setIsRunning, setCurrentCycle, 
    incrementCycle, setPomodoroSubject, decrementTime
  } = usePomodoroStore();
  const { saveWeeklyPlan, addPomodoroSession, saveDailyLog, saveStreak } = useCloudSync();
  const { playPomodoroComplete, playBreakComplete } = usePomodoroSound();

  // State
  const [wakeUpTime, setWakeUpTime] = useState<number | null>(null);
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
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

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
      const today = getEffectiveDateString();
      
      // Check wake-up log
      const { data: wakeUpData } = await supabase
        .from('wake_up_logs')
        .select('wake_time')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .maybeSingle();

      if (wakeUpData) {
        const [hours, minutes] = wakeUpData.wake_time.split(':').map(Number);
        setWakeUpTime(hours + minutes / 60);
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
        
        // Calculate total study time
        let totalMins = 0;
        activitiesData.forEach(a => {
          if (a.activity_type === 'study' && a.end_time) {
            const [startH, startM] = a.start_time.split(':').map(Number);
            const [endH, endM] = a.end_time.split(':').map(Number);
            totalMins += (endH * 60 + endM) - (startH * 60 + startM);
          }
        });
        setTotalStudyMinutes(totalMins);
        
        // Build study markers from activities with colors
        const markers: StudyMarker[] = [];
        activitiesData.forEach(a => {
          if (a.activity_type === 'study') {
            const startH = parseInt(a.start_time.split(':')[0]) + parseInt(a.start_time.split(':')[1]) / 60;
            const subjectColor = a.subject ? (subjectColorsFromPlan[a.subject] || SUBJECT_COLORS[a.subject]) : undefined;
            markers.push({ hour: startH, type: 'start', subject: a.subject || undefined, color: subjectColor });
            if (a.end_time) {
              const endH = parseInt(a.end_time.split(':')[0]) + parseInt(a.end_time.split(':')[1]) / 60;
              markers.push({ hour: endH, type: 'end', subject: a.subject || undefined, color: subjectColor });
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
        
        // Restore pomodoro state if in pomodoro mode
        if (statusData.study_mode === 'pomodoro') {
          setPomodoroSubject(statusData.current_subject);
          setIsRunning(true);
        }
      }
    };

    loadTodayData();
  }, [user]);

  // Get available subjects from today's plan with their colors
  const todayIndex = getTodayIndex();
  const todayPlan = weeklyPlan.find(d => d.dayIndex === todayIndex);
  const availableSubjects = todayPlan?.sessions.map(s => s.subject) || [];
  
  // Build subject colors map from weekly plan
  const subjectColorsFromPlan: Record<string, string> = {};
  todayPlan?.sessions.forEach(s => {
    if (s.subject && s.color) {
      subjectColorsFromPlan[s.subject] = s.color;
    }
  });

  // Initialize today's daily log if not exists
  useEffect(() => {
    if (!user || !todayPlan || todayPlan.sessions.length === 0) return;
    
    const today = getEffectiveDateString();
    const existingLog = dailyLogs.find(log => log.date === today);
    
    if (!existingLog) {
      // Create initial log for today with 0 progress
      const initialLog: DailyLogType = {
        id: `${today}-${user.id}`,
        date: today,
        totalStudyHours: 0,
        totalTests: 0,
        completedSessions: 0,
        totalSessions: todayPlan.sessions.length,
        overallScore: 0,
        feedback: '',
        sessions: todayPlan.sessions.map(s => ({
          subject: s.subject,
          targetHours: s.targetHours,
          actualHours: 0,
          targetTests: s.targetTests,
          actualTests: 0,
          completed: false,
          color: s.color || '#8B5CF6',
        })),
      };
      
      saveDailyLog(initialLog);
      setDailyLogs([initialLog, ...dailyLogs]);
    }
  }, [user, todayPlan, dailyLogs, saveDailyLog, setDailyLogs]);

  const handleWakeUp = async () => {
    if (!user) return;
    
    // Use current time immediately
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const wakeHour = hours + minutes / 60;
    
    const today = getEffectiveDateString();
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
    
    const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    toast({
      title: '☀️ بیداری ثبت شد',
      description: `ساعت بیداری: ${timeDisplay}`,
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
    const today = getEffectiveDateString();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    const subjectColor = subjectColorsFromPlan[subject] || SUBJECT_COLORS[subject] || '#8B5CF6';
    
    await supabase.from('study_activities').insert({
      user_id: user.id,
      activity_date: today,
      activity_type: 'study',
      subject,
      color: subjectColor,
      start_time: timeStr,
      is_active: true,
      study_mode: studyMode,
    });

    setCurrentStudySession({
      subject,
      mode: studyMode,
      startTime: now,
    });
    
    // Add start marker with subject color
    const startHour = now.getHours() + now.getMinutes() / 60;
    setStudyMarkers(prev => [...prev, { hour: startHour, type: 'start', subject, color: subjectColor }]);

    if (studyMode === 'pomodoro') {
      setPomodoroSubject(subject);
      setMode('study');
      setTimeLeft(pomodoroSettings.studyDuration * 60);
      setIsRunning(true);
      lastTickRef.current = Date.now();
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
    const today = getEffectiveDateString();
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
    const durationHours = durationMinutes / 60;
    
    // Always save study time and update weekly plan
    if (durationMinutes > 0) {
      await addPomodoroSession(currentStudySession.subject, durationMinutes);
      
      // Get fresh state from store to avoid stale closure issues
      const freshState = useStudyStore.getState();
      const freshTodayIndex = freshState.getTodayIndex();
      const freshTodayPlan = freshState.weeklyPlan.find(d => d.dayIndex === freshTodayIndex);
      
      // Update weekly plan session with actual hours
      if (freshTodayPlan) {
        const targetSession = freshTodayPlan.sessions.find(s => s.subject === currentStudySession.subject);
        if (targetSession) {
          const newHours = (targetSession.actualHours || 0) + durationHours;
          console.log('[Study] Updating hours:', { subject: currentStudySession.subject, oldHours: targetSession.actualHours, newHours, durationMinutes });
          
          // Update local store first
          updateSession(freshTodayPlan.id, targetSession.id, { actualHours: newHours });
          
          // Then save to cloud with fresh state
          const updatedSessions = freshTodayPlan.sessions.map(s => 
            s.id === targetSession.id ? { ...s, actualHours: newHours } : s
          );
          await saveWeeklyPlan(freshTodayPlan.id, updatedSessions);
        }
      }
      
      // Update streak and save to cloud
      useStudyStore.getState().updateStreak();
      const updatedState = useStudyStore.getState();
      await saveStreak(updatedState.streak, updatedState.lastStudyDate);
    }

    // Add end marker with subject color
    const subjectColor = subjectColorsFromPlan[currentStudySession.subject] || SUBJECT_COLORS[currentStudySession.subject];
    const endHour = now.getHours() + now.getMinutes() / 60;
    setStudyMarkers(prev => [...prev, { hour: endHour, type: 'end', subject: currentStudySession.subject, color: subjectColor }]);

    // Update total study time
    setTotalStudyMinutes(prev => prev + durationMinutes);

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
    }

    // Update daily log for performance history - small delay to ensure store is updated
    setTimeout(async () => {
      await updateTodayDailyLog();
    }, 200);

    toast({
      title: '✅ پایان مطالعه',
      description: `${currentStudySession.subject} - ${durationMinutes} دقیقه`,
    });
  };

  // Pomodoro timer effect - persistent across navigation
  useEffect(() => {
    if (!isRunning || currentStudySession?.mode !== 'pomodoro') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Calculate elapsed time since last tick (handles navigation)
    const now = Date.now();
    const elapsed = Math.floor((now - lastTickRef.current) / 1000);
    if (elapsed > 1) {
      // Catch up if we missed some time
      const state = usePomodoroStore.getState();
      const newTime = Math.max(0, state.timeLeft - elapsed);
      state.setTimeLeft(newTime);
    }
    lastTickRef.current = now;

    intervalRef.current = setInterval(() => {
      const state = usePomodoroStore.getState();
      lastTickRef.current = Date.now();
      
      if (state.timeLeft > 0) {
        state.decrementTime();
      } else {
        // Timer finished
        if (state.mode === 'study') {
          // Play sound
          playPomodoroComplete();
          
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
          // Break finished - play sound
          playBreakComplete();
          
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
  }, [isRunning, currentStudySession, pomodoroSettings, currentCycle, addPomodoroSession, playPomodoroComplete, playBreakComplete]);

  // Free time counter - also persistent
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
  
  // Format hours to HH:MM
  const formatHoursToHHMM = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Calculate current session study minutes for display
  const currentSessionMinutes = currentStudySession 
    ? Math.floor((Date.now() - currentStudySession.startTime.getTime()) / 60000)
    : 0;

  // Function to update and save today's daily log - reads from fresh store state
  const updateTodayDailyLog = useCallback(async () => {
    if (!user) return;
    
    // Get fresh state from store
    const freshState = useStudyStore.getState();
    const freshTodayIndex = freshState.getTodayIndex();
    const freshTodayPlan = freshState.weeklyPlan.find(d => d.dayIndex === freshTodayIndex);
    
    if (!freshTodayPlan) return;
    
    const today = getEffectiveDateString();
    
    // Calculate totals from fresh plan state
    let totalStudyHours = 0;
    let totalTests = 0;
    let completedSessions = 0;
    const sessionsData: DailyLogSession[] = [];
    
    freshTodayPlan.sessions.forEach(session => {
      totalStudyHours += session.actualHours || 0;
      totalTests += session.actualTests || 0;
      
      // Check if session is completed (at least 50% of target)
      const hoursProgress = session.targetHours > 0 ? (session.actualHours / session.targetHours) : 0;
      const testsProgress = session.targetTests > 0 ? (session.actualTests / session.targetTests) : 0;
      const avgProgress = (hoursProgress + testsProgress) / 2;
      
      if (avgProgress >= 0.5) {
        completedSessions++;
      }
      
      sessionsData.push({
        subject: session.subject,
        targetHours: session.targetHours,
        actualHours: session.actualHours || 0,
        targetTests: session.targetTests,
        actualTests: session.actualTests || 0,
        completed: avgProgress >= 0.5,
        color: session.color || '#8B5CF6',
        notes: session.notes || '',
      });
    });
    
    const totalSessions = freshTodayPlan.sessions.length;
    
    // Calculate overallScore based on actual progress vs targets (not just completion count)
    let totalTargetHours = 0;
    let totalTargetTests = 0;
    freshTodayPlan.sessions.forEach(session => {
      totalTargetHours += session.targetHours || 0;
      totalTargetTests += session.targetTests || 0;
    });
    
    const hoursProgress = totalTargetHours > 0 ? Math.min(100, (totalStudyHours / totalTargetHours) * 100) : 0;
    const testsProgress = totalTargetTests > 0 ? Math.min(100, (totalTests / totalTargetTests) * 100) : 0;
    const completionProgress = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    
    // Weighted average: 40% hours, 40% tests, 20% session completion
    const overallScore = Math.round((hoursProgress * 0.4) + (testsProgress * 0.4) + (completionProgress * 0.2));
    
    const dailyLogData: DailyLogType = {
      id: `${today}-${user.id}`,
      date: today,
      totalStudyHours,
      totalTests,
      completedSessions,
      totalSessions,
      overallScore,
      feedback: '',
      sessions: sessionsData,
    };
    
    console.log('[DailyLog] Saving daily log:', { date: today, totalStudyHours, sessionsData });
    
    // Save to cloud
    await saveDailyLog(dailyLogData);
    
    // Update local store with fresh data
    const freshLogs = useStudyStore.getState().dailyLogs;
    const existingIndex = freshLogs.findIndex(log => log.date === today);
    if (existingIndex >= 0) {
      const updatedLogs = [...freshLogs];
      updatedLogs[existingIndex] = dailyLogData;
      setDailyLogs(updatedLogs);
    } else {
      setDailyLogs([dailyLogData, ...freshLogs]);
    }
  }, [user, saveDailyLog, setDailyLogs]);

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
              {todayPlan?.dayName || 'امروز'} - مطالعه و ثبت فعالیت
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
                    <h3 className="font-semibold mb-2">ابتدا بیداری را ثبت کنید</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      با کلیک روی دکمه، ساعت فعلی به عنوان بیداری ثبت می‌شود
                    </p>
                    <Button 
                      onClick={handleWakeUp}
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
                    totalStudyMinutes={totalStudyMinutes + currentSessionMinutes}
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
            {/* Today's Plan from Weekly Program */}
            {todayPlan && todayPlan.sessions.length > 0 && (
              <GlassCard delay={1}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  برنامه امروز
                </h3>
                <div className="space-y-2">
                  {todayPlan.sessions.map((session) => {
                    const progressHours = (session.actualHours / session.targetHours) * 100 || 0;
                    const progressTests = (session.actualTests / session.targetTests) * 100 || 0;
                    
                    const handleAddTests = async (amount: number) => {
                      const newTests = Math.max(0, session.actualTests + amount);
                      updateSession(todayPlan.id, session.id, { actualTests: newTests });
                      
                      // Save to cloud
                      const updatedSessions = todayPlan.sessions.map(s => 
                        s.id === session.id ? { ...s, actualTests: newTests } : s
                      );
                      await saveWeeklyPlan(todayPlan.id, updatedSessions);
                      
                      // Update daily log for performance history
                      setTimeout(() => updateTodayDailyLog(), 100);
                    };
                    
                    return (
                      <div 
                        key={session.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: session.color || 'hsl(var(--primary))' }}
                          />
                          <span className="font-medium flex-1">{session.subject}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="flex justify-between text-muted-foreground mb-1">
                              <span>ساعت</span>
                              <span>{formatHoursToHHMM(session.actualHours)} / {formatHoursToHHMM(session.targetHours)}</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, progressHours)}%`,
                                  backgroundColor: session.color || 'hsl(var(--primary))'
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-muted-foreground mb-1">
                              <span>تست</span>
                              <span>{session.actualTests} / {session.targetTests}</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, progressTests)}%`,
                                  backgroundColor: session.color || 'hsl(var(--primary))'
                                }}
                              />
                            </div>
                            {/* Test input buttons */}
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleAddTests(-5)}
                              >
                                -5
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleAddTests(-1)}
                              >
                                -1
                              </Button>
                              <Input
                                type="number"
                                value={session.actualTests}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  updateSession(todayPlan.id, session.id, { actualTests: val });
                                  const updatedSessions = todayPlan.sessions.map(s => 
                                    s.id === session.id ? { ...s, actualTests: val } : s
                                  );
                                  saveWeeklyPlan(todayPlan.id, updatedSessions);
                                }}
                                className="h-6 w-12 text-center text-xs p-1"
                                min={0}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleAddTests(1)}
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => handleAddTests(5)}
                              >
                                +5
                              </Button>
                            </div>
                          </div>
                        </div>
                        {/* Show notes if exists */}
                        {session.notes && (
                          <div className="mt-2 p-2 rounded bg-muted/20 text-xs text-muted-foreground">
                            <span className="font-medium">یادداشت: </span>{session.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Pension Members Status */}
            <PensionMembersStatus />

            {/* Pension Members Study Time */}
            <PensionMembersStudyTime />
          </div>
        </div>


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
