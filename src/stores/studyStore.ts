import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudySession {
  id: string;
  subject: string;
  targetHours: number;
  targetTests: number;
  actualHours: number;
  actualTests: number;
  completed: boolean;
  completionPercent: number;
  notes: string;
  color: string;
}

export interface DayPlan {
  id: string;
  dayName: string;
  dayIndex: number;
  sessions: StudySession[];
}

export interface DailyLogSession {
  subject: string;
  targetHours: number;
  targetTests: number;
  actualHours: number;
  actualTests: number;
  completed: boolean;
  color: string;
  notes?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  totalStudyHours: number;
  totalTests: number;
  completedSessions: number;
  totalSessions: number;
  overallScore: number;
  feedback: string;
  sessions?: DailyLogSession[];
}

export interface PomodoroSettings {
  studyDuration: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
}

export interface PomodoroSession {
  id: string;
  date: string;
  subject: string;
  minutes: number;
  completedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  persianDate: { year: number; month: number; day: number };
}

interface StudyStore {
  weeklyPlan: DayPlan[];
  dailyLogs: DailyLog[];
  currentWeekStart: Date;
  streak: number;
  lastStudyDate: string | null;
  pomodoroSettings: PomodoroSettings;
  totalPomodoroMinutesToday: number;
  pomodoroSubject: string | null;
  lastPomodoroDate: string | null;
  pomodoroHistory: PomodoroSession[];
  calendarEvents: CalendarEvent[];
  lastWeeklyReset: string | null;
  
  // Actions
  initializeWeek: () => void;
  resetWeek: () => void;
  checkAndResetWeekly: () => void;
  addSession: (dayId: string, session: Omit<StudySession, 'id'>) => void;
  updateSession: (dayId: string, sessionId: string, updates: Partial<StudySession>) => void;
  deleteSession: (dayId: string, sessionId: string) => void;
  toggleSessionComplete: (dayId: string, sessionId: string) => void;
  logDaily: (dayId: string) => void;
  updateStreak: () => void;
  setPomodoroSettings: (settings: PomodoroSettings) => void;
  addPomodoroTime: (minutes: number, subject: string) => void;
  setPomodoroSubject: (subject: string | null) => void;
  getTodayIndex: () => number;
  getTodayPomodoros: () => PomodoroSession[];
  getWeeklyPomodoroCount: () => number;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (eventId: string) => void;
  clearAllLogs: () => void;
  getUpcomingEvents: () => { event: CalendarEvent; daysRemaining: number }[];
  getStats: () => { 
    totalHours: number; 
    totalTests: number; 
    avgCompletion: number;
    subjectStats: Record<string, { hours: number; tests: number; sessions: number }>;
  };
}

const PERSIAN_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

const SUBJECT_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#a855f7', '#3b82f6', '#84cc16', '#f43f5e', '#22d3d8',
  '#facc15', '#fb7185', '#34d399', '#818cf8', '#fbbf24', '#c084fc',
  '#a5f3fc', '#2dd4bf', '#e879f9', '#4ade80', '#fcd34d', '#f472b6', '#38bdf8'
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const getPerformanceFeedback = (score: number): string => {
  if (score >= 90) return '🌟 عالی! عملکرد فوق‌العاده‌ای داشتی!';
  if (score >= 75) return '✨ خیلی خوب! به هدفت نزدیک شدی!';
  if (score >= 60) return '💪 خوب بود! با کمی تلاش بیشتر می‌تونی بهتر بشی!';
  if (score >= 40) return '📚 نیاز به تمرکز بیشتر داری. فردا قوی‌تر برگرد!';
  return '🎯 امروز سخت بود، اما فردا روز جدیدی است!';
};

const createEmptySessions = (): StudySession[] => {
  return [];
};

const formatNumber = (num: number): number => {
  // Keep user input exactly as entered - no floating point issues
  return Math.round(num * 100) / 100;
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      weeklyPlan: [],
      dailyLogs: [],
      currentWeekStart: new Date(),
      streak: 0,
      lastStudyDate: null,
      pomodoroSettings: {
        studyDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        cycles: 4,
      },
      totalPomodoroMinutesToday: 0,
      lastPomodoroDate: null,
      pomodoroSubject: null,
      pomodoroHistory: [],
      calendarEvents: [],
      lastWeeklyReset: null,

      getTodayIndex: () => {
        const today = new Date().getDay();
        // Convert JS day (0=Sunday) to Persian day (0=Saturday)
        return today === 6 ? 0 : today + 1;
      },

      initializeWeek: () => {
        const state = get();
        // Only initialize if empty
        if (state.weeklyPlan.length > 0) return;
        
        const weeklyPlan: DayPlan[] = PERSIAN_DAYS.map((dayName, dayIndex) => ({
          id: generateId(),
          dayName,
          dayIndex,
          sessions: createEmptySessions(),
        }));
        set({ weeklyPlan, currentWeekStart: new Date() });
      },

      resetWeek: () => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map(day => ({
            ...day,
            sessions: day.sessions.map(session => ({
              ...session,
              actualHours: 0,
              actualTests: 0,
              completed: false,
              completionPercent: 0,
              notes: '',
            })),
          })),
          totalPomodoroMinutesToday: 0,
          lastPomodoroDate: null,
          lastWeeklyReset: new Date().toISOString(),
        }));
      },

      checkAndResetWeekly: () => {
        const state = get();
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Check if today is Saturday (6 in JS, which is 0 in Persian week)
        if (dayOfWeek !== 6) return;
        
        // Check if we already reset today
        if (state.lastWeeklyReset) {
          const lastReset = new Date(state.lastWeeklyReset);
          const isSameDay = 
            lastReset.getFullYear() === today.getFullYear() &&
            lastReset.getMonth() === today.getMonth() &&
            lastReset.getDate() === today.getDate();
          
          if (isSameDay) return;
        }
        
        // Reset the week
        get().resetWeek();
      },

      addSession: (dayId, session) => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map((day) =>
            day.id === dayId
              ? { 
                  ...day, 
                  sessions: [...day.sessions, { 
                    ...session, 
                    id: generateId(),
                    targetHours: formatNumber(session.targetHours),
                    targetTests: Math.round(session.targetTests),
                  }] 
                }
              : day
          ),
        }));
      },

      updateSession: (dayId, sessionId, updates) => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  sessions: day.sessions.map((s) =>
                    s.id === sessionId 
                      ? { 
                          ...s, 
                          ...updates,
                          actualHours: updates.actualHours !== undefined ? formatNumber(updates.actualHours) : s.actualHours,
                          targetHours: updates.targetHours !== undefined ? formatNumber(updates.targetHours) : s.targetHours,
                          actualTests: updates.actualTests !== undefined ? Math.round(updates.actualTests) : s.actualTests,
                          targetTests: updates.targetTests !== undefined ? Math.round(updates.targetTests) : s.targetTests,
                        } 
                      : s
                  ),
                }
              : day
          ),
        }));
      },

      deleteSession: (dayId, sessionId) => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map((day) =>
            day.id === dayId
              ? { ...day, sessions: day.sessions.filter((s) => s.id !== sessionId) }
              : day
          ),
        }));
      },

      toggleSessionComplete: (dayId, sessionId) => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map((day) =>
            day.id === dayId
              ? {
                  ...day,
                  sessions: day.sessions.map((s) =>
                    s.id === sessionId
                      ? { 
                          ...s, 
                          completed: !s.completed,
                          completionPercent: !s.completed ? 100 : s.completionPercent
                        }
                      : s
                  ),
                }
              : day
          ),
        }));
        // Update streak when completing a session
        get().updateStreak();
      },

      updateStreak: () => {
        const today = new Date().toDateString();
        const state = get();
        
        if (state.lastStudyDate === today) {
          // Already counted today
          return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (state.lastStudyDate === yesterdayString) {
          // Consecutive day
          set({ streak: state.streak + 1, lastStudyDate: today });
        } else if (state.lastStudyDate === null || state.lastStudyDate !== today) {
          // First day or missed a day
          set({ streak: 1, lastStudyDate: today });
        }
      },

      logDaily: (dayId) => {
        const state = get();
        const day = state.weeklyPlan.find((d) => d.id === dayId);
        if (!day) return;

        const totalStudyHours = formatNumber(day.sessions.reduce((sum, s) => sum + s.actualHours, 0));
        const totalTests = day.sessions.reduce((sum, s) => sum + s.actualTests, 0);
        const completedSessions = day.sessions.filter((s) => s.completed).length;
        const totalSessions = day.sessions.length;
        
        const targetHours = day.sessions.reduce((sum, s) => sum + s.targetHours, 0);
        const targetTests = day.sessions.reduce((sum, s) => sum + s.targetTests, 0);
        
        const hoursScore = targetHours > 0 ? (totalStudyHours / targetHours) * 100 : 0;
        const testsScore = targetTests > 0 ? (totalTests / targetTests) * 100 : 0;
        const completionScore = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
        
        const overallScore = Math.min(100, (hoursScore + testsScore + completionScore) / 3);
        const feedback = getPerformanceFeedback(overallScore);

        // Capture session details for history
        const sessionDetails: DailyLogSession[] = day.sessions.map(s => ({
          subject: s.subject,
          targetHours: s.targetHours,
          targetTests: s.targetTests,
          actualHours: s.actualHours,
          actualTests: s.actualTests,
          completed: s.completed,
          color: s.color,
          notes: s.notes,
        }));

        // Use today's date directly
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];

        // Check for existing log for today
        const existingLogIndex = state.dailyLogs.findIndex(log => 
          log.date.split('T')[0] === todayKey
        );

        if (existingLogIndex !== -1) {
          // Update existing log
          set((state) => ({
            dailyLogs: state.dailyLogs.map((log, idx) =>
              idx === existingLogIndex
                ? {
                    ...log,
                    date: today.toISOString(),
                    totalStudyHours,
                    totalTests,
                    completedSessions,
                    totalSessions,
                    overallScore,
                    feedback,
                    sessions: sessionDetails,
                  }
                : log
            ),
          }));
        } else {
          // Create new log
          const newLog: DailyLog = {
            id: generateId(),
            date: today.toISOString(),
            totalStudyHours,
            totalTests,
            completedSessions,
            totalSessions,
            overallScore,
            feedback,
            sessions: sessionDetails,
          };

          set((state) => ({
            dailyLogs: [...state.dailyLogs, newLog],
          }));
        }
        
        // Update streak
        get().updateStreak();
      },

      setPomodoroSettings: (settings) => {
        set({ pomodoroSettings: settings });
      },

      setPomodoroSubject: (subject) => {
        set({ pomodoroSubject: subject });
      },

      addPomodoroTime: (minutes, subject) => {
        const today = new Date().toDateString();
        const state = get();
        
        // Create new pomodoro session record
        const newSession: PomodoroSession = {
          id: generateId(),
          date: today,
          subject,
          minutes,
          completedAt: new Date().toISOString(),
        };
        
        // Reset daily count if new day
        if (state.lastPomodoroDate !== today) {
          set({ 
            totalPomodoroMinutesToday: minutes, 
            lastPomodoroDate: today,
            pomodoroHistory: [...state.pomodoroHistory, newSession],
          });
        } else {
          set({ 
            totalPomodoroMinutesToday: state.totalPomodoroMinutesToday + minutes,
            pomodoroHistory: [...state.pomodoroHistory, newSession],
          });
        }
        
        // Add to the specific subject session
        const todayIndex = get().getTodayIndex();
        const todayPlan = state.weeklyPlan[todayIndex];
        if (todayPlan) {
          const targetSession = todayPlan.sessions.find(s => s.subject === subject);
          if (targetSession) {
            get().updateSession(todayPlan.id, targetSession.id, {
              actualHours: targetSession.actualHours + (minutes / 60),
            });
          }
        }
        
        // Update streak
        get().updateStreak();
      },

      getTodayPomodoros: () => {
        const today = new Date().toDateString();
        const state = get();
        return state.pomodoroHistory.filter(p => p.date === today);
      },

      getWeeklyPomodoroCount: () => {
        const state = get();
        const now = new Date();
        
        // Get start of current week (Saturday)
        const dayOfWeek = now.getDay();
        const daysFromSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysFromSaturday);
        weekStart.setHours(0, 0, 0, 0);
        
        return state.pomodoroHistory.filter(p => {
          const sessionDate = new Date(p.date);
          return sessionDate >= weekStart;
        }).length;
      },

      addCalendarEvent: (event) => {
        set((state) => ({
          calendarEvents: [...state.calendarEvents, { ...event, id: generateId() }],
        }));
      },

      deleteCalendarEvent: (eventId) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== eventId),
        }));
      },

      clearAllLogs: () => {
        set({ dailyLogs: [] });
      },

      getUpcomingEvents: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return state.calendarEvents
          .map((event) => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            const diffTime = eventDate.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { event, daysRemaining };
          })
          .filter(({ daysRemaining }) => daysRemaining >= 0)
          .sort((a, b) => a.daysRemaining - b.daysRemaining);
      },

      getStats: () => {
        const state = get();
        const subjectStats: Record<string, { hours: number; tests: number; sessions: number }> = {};
        
        let totalHours = 0;
        let totalTests = 0;
        let totalCompletion = 0;
        let sessionCount = 0;

        state.weeklyPlan.forEach((day) => {
          day.sessions.forEach((session) => {
            totalHours += session.actualHours;
            totalTests += session.actualTests;
            totalCompletion += session.completionPercent;
            sessionCount++;

            if (!subjectStats[session.subject]) {
              subjectStats[session.subject] = { hours: 0, tests: 0, sessions: 0 };
            }
            subjectStats[session.subject].hours += session.actualHours;
            subjectStats[session.subject].tests += session.actualTests;
            subjectStats[session.subject].sessions++;
          });
        });

        return {
          totalHours: formatNumber(totalHours),
          totalTests,
          avgCompletion: sessionCount > 0 ? formatNumber(totalCompletion / sessionCount) : 0,
          subjectStats,
        };
      },
    }),
    {
      name: 'study-planner-storage',
      version: 2,
      migrate: () => ({
        weeklyPlan: [],
        dailyLogs: [],
        currentWeekStart: new Date(),
        streak: 0,
        lastStudyDate: null,
        pomodoroSettings: {
          studyDuration: 25,
          shortBreak: 5,
          longBreak: 15,
          cycles: 4,
        },
        totalPomodoroMinutesToday: 0,
        lastPomodoroDate: null,
        pomodoroSubject: null,
        pomodoroHistory: [],
        calendarEvents: [],
        lastWeeklyReset: null,
      }),
    }
  )
);
