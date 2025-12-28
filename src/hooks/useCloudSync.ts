import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStudyStore, DayPlan, DailyLog, CalendarEvent, PomodoroSettings, StudySession, DailyLogSession } from '@/stores/studyStore';

const PERSIAN_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

export const useCloudSync = () => {
  const { user } = useAuth();
  const store = useStudyStore();
  const isInitialLoad = useRef(true);
  const isSyncing = useRef(false);

  // Load data from cloud
  const loadFromCloud = useCallback(async () => {
    if (!user || isSyncing.current) return;
    
    isSyncing.current = true;
    
    try {
      // Load weekly plans
      const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('day_index');

      if (weeklyPlans && weeklyPlans.length > 0) {
        const formattedPlans: DayPlan[] = weeklyPlans.map(plan => ({
          id: plan.id,
          dayName: plan.day_name,
          dayIndex: plan.day_index,
          sessions: (plan.sessions as unknown as StudySession[]) || [],
        }));
        store.setWeeklyPlan(formattedPlans);
      } else {
        // Initialize empty week in cloud
        await initializeWeekInCloud();
      }

      // Load daily logs
      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (dailyLogs) {
        const formattedLogs: DailyLog[] = dailyLogs.map(log => ({
          id: log.id,
          date: log.date,
          totalStudyHours: Number(log.total_study_hours),
          totalTests: log.total_tests,
          completedSessions: log.completed_sessions,
          totalSessions: log.total_sessions,
          overallScore: Number(log.overall_score),
          feedback: log.feedback || '',
          sessions: (log.sessions as unknown as DailyLogSession[]) || [],
        }));
        store.setDailyLogs(formattedLogs);
      }

      // Load calendar events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);

      if (events) {
        const formattedEvents: CalendarEvent[] = events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.event_date,
          persianDate: {
            year: event.persian_year || 0,
            month: event.persian_month || 0,
            day: event.persian_day || 0,
          },
        }));
        store.setCalendarEvents(formattedEvents);
      }

      // Load user settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        store.setPomodoroSettings({
          studyDuration: settings.pomodoro_study_duration,
          shortBreak: settings.pomodoro_short_break,
          longBreak: settings.pomodoro_long_break,
          cycles: settings.pomodoro_cycles,
        });
        store.setStreak(settings.streak);
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error loading from cloud:', error);
      }
    } finally {
      isSyncing.current = false;
      isInitialLoad.current = false;
    }
  }, [user]);

  // Initialize week in cloud
  const initializeWeekInCloud = async () => {
    if (!user) return;

    const plans = PERSIAN_DAYS.map((dayName, dayIndex) => ({
      user_id: user.id,
      day_name: dayName,
      day_index: dayIndex,
      sessions: [] as unknown as any,
    }));

    const { data } = await supabase
      .from('weekly_plans')
      .insert(plans)
      .select();

    if (data) {
      const formattedPlans: DayPlan[] = data.map(plan => ({
        id: plan.id,
        dayName: plan.day_name,
        dayIndex: plan.day_index,
        sessions: [],
      }));
      store.setWeeklyPlan(formattedPlans);
    }
  };

  // Save weekly plan to cloud (removed isSyncing check - save should always work)
  const saveWeeklyPlan = useCallback(async (dayId: string, sessions: StudySession[]) => {
    if (!user) return;

    try {
      console.log('[Cloud] Saving weekly plan:', { dayId, sessionsCount: sessions.length });
      const { error } = await supabase
        .from('weekly_plans')
        .update({ sessions: sessions as unknown as any })
        .eq('id', dayId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[Cloud] Error saving weekly plan:', error);
      } else {
        console.log('[Cloud] Weekly plan saved successfully');
      }
    } catch (error) {
      console.error('[Cloud] Exception saving weekly plan:', error);
    }
  }, [user]);

  // Save daily log to cloud
  const saveDailyLog = useCallback(async (log: DailyLog) => {
    if (!user) return;

    const dateOnly = log.date.split('T')[0];

    try {
      console.log('[Cloud] Saving daily log:', { date: dateOnly, hours: log.totalStudyHours });
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateOnly)
        .maybeSingle();

      const logData = {
        total_study_hours: log.totalStudyHours,
        total_tests: log.totalTests,
        completed_sessions: log.completedSessions,
        total_sessions: log.totalSessions,
        overall_score: log.overallScore,
        feedback: log.feedback,
        sessions: log.sessions as unknown as any,
      };

      if (existing) {
        const { error } = await supabase
          .from('daily_logs')
          .update(logData)
          .eq('id', existing.id);
        if (error) console.error('[Cloud] Error updating daily log:', error);
        else console.log('[Cloud] Daily log updated successfully');
      } else {
        const { error } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date: dateOnly,
            ...logData,
          });
        if (error) console.error('[Cloud] Error inserting daily log:', error);
        else console.log('[Cloud] Daily log inserted successfully');
      }
    } catch (error) {
      console.error('[Cloud] Exception saving daily log:', error);
    }
  }, [user]);

  // Save calendar event to cloud
  const saveCalendarEvent = useCallback(async (event: CalendarEvent) => {
    if (!user) return;

    try {
      await supabase
        .from('calendar_events')
        .insert({
          id: event.id,
          user_id: user.id,
          title: event.title,
          event_date: event.date,
          persian_year: event.persianDate.year,
          persian_month: event.persianDate.month,
          persian_day: event.persianDate.day,
        });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error saving calendar event:', error);
      }
    }
  }, [user]);

  // Delete calendar event from cloud
  const deleteCalendarEventFromCloud = useCallback(async (eventId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error deleting calendar event:', error);
      }
    }
  }, [user]);

  // Save pomodoro settings to cloud
  const savePomodoroSettings = useCallback(async (settings: PomodoroSettings) => {
    if (!user) return;

    try {
      await supabase
        .from('user_settings')
        .update({
          pomodoro_study_duration: settings.studyDuration,
          pomodoro_short_break: settings.shortBreak,
          pomodoro_long_break: settings.longBreak,
          pomodoro_cycles: settings.cycles,
        })
        .eq('user_id', user.id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error saving pomodoro settings:', error);
      }
    }
  }, [user]);

  // Save streak to cloud
  const saveStreak = useCallback(async (streak: number, lastStudyDate: string | null) => {
    if (!user) return;

    try {
      await supabase
        .from('user_settings')
        .update({
          streak,
          last_study_date: lastStudyDate,
        })
        .eq('user_id', user.id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error saving streak:', error);
      }
    }
  }, [user]);

  // Add pomodoro session to cloud
  const addPomodoroSession = useCallback(async (subject: string, minutes: number) => {
    if (!user) return;

    try {
      await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          subject,
          minutes,
        });
      
      // Update profile total study minutes
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_study_minutes')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_study_minutes: (profile.total_study_minutes || 0) + minutes })
          .eq('user_id', user.id);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error saving pomodoro session:', error);
      }
    }
  }, [user]);

  // Update profile stats (study hours and tests)
  const updateProfileStats = useCallback(async (studyMinutes: number, tests: number) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_study_minutes, total_tests')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_study_minutes: (profile.total_study_minutes || 0) + studyMinutes,
            total_tests: (profile.total_tests || 0) + tests,
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error updating profile stats:', error);
      }
    }
  }, [user]);

  // Check and reset weekly data in cloud (every Saturday)
  const checkAndResetWeeklyInCloud = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    console.log('[Weekly Reset] Checking... dayOfWeek:', dayOfWeek, '(6 = Saturday)');
    
    // Only reset on Saturday (6 in JS)
    if (dayOfWeek !== 6) {
      console.log('[Weekly Reset] Not Saturday, skipping reset');
      return;
    }

    try {
      // Check if we already reset today
      const { data: settings } = await supabase
        .from('user_settings')
        .select('last_weekly_reset')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Weekly Reset] Last reset date:', settings?.last_weekly_reset);

      if (settings?.last_weekly_reset) {
        const lastReset = new Date(settings.last_weekly_reset);
        const isSameDay = 
          lastReset.getFullYear() === today.getFullYear() &&
          lastReset.getMonth() === today.getMonth() &&
          lastReset.getDate() === today.getDate();
        
        if (isSameDay) {
          console.log('[Weekly Reset] Already reset today, skipping');
          return;
        }
      }

      console.log('[Weekly Reset] Starting weekly reset...');

      // Get current weekly plans
      const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id);

      if (weeklyPlans && weeklyPlans.length > 0) {
        // Reset each day's sessions (keep structure, reset progress)
        for (const plan of weeklyPlans) {
          const sessions = (plan.sessions as unknown as StudySession[]) || [];
          const resetSessions = sessions.map(session => ({
            ...session,
            actualHours: 0,
            actualTests: 0,
            completed: false,
            completionPercent: 0,
            notes: '',
          }));

          await supabase
            .from('weekly_plans')
            .update({ sessions: resetSessions as unknown as any })
            .eq('id', plan.id);
        }

        // Update local store
        const formattedPlans: DayPlan[] = weeklyPlans.map(plan => {
          const sessions = (plan.sessions as unknown as StudySession[]) || [];
          return {
            id: plan.id,
            dayName: plan.day_name,
            dayIndex: plan.day_index,
            sessions: sessions.map(session => ({
              ...session,
              actualHours: 0,
              actualTests: 0,
              completed: false,
              completionPercent: 0,
              notes: '',
            })),
          };
        });
        store.setWeeklyPlan(formattedPlans);
      }

      // Update last_weekly_reset
      const todayStr = today.toISOString().split('T')[0];
      await supabase
        .from('user_settings')
        .update({ last_weekly_reset: todayStr })
        .eq('user_id', user.id);

      // Also reset local pomodoro daily data
      store.setLastWeeklyReset(new Date().toISOString());

      console.log('[Cloud] Weekly reset completed');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Debug] Error in weekly reset:', error);
      }
    }
  }, [user, store]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadFromCloud().then(() => {
        // Check for weekly reset after loading
        checkAndResetWeeklyInCloud();
      });
    }
  }, [user, loadFromCloud, checkAndResetWeeklyInCloud]);

  return {
    loadFromCloud,
    saveWeeklyPlan,
    saveDailyLog,
    saveCalendarEvent,
    deleteCalendarEventFromCloud,
    savePomodoroSettings,
    saveStreak,
    addPomodoroSession,
    updateProfileStats,
    checkAndResetWeeklyInCloud,
    isInitialLoad: isInitialLoad.current,
  };
};
