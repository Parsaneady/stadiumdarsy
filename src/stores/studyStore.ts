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

export interface DailyLog {
  id: string;
  date: string;
  totalStudyHours: number;
  totalTests: number;
  completedSessions: number;
  totalSessions: number;
  overallScore: number;
  feedback: string;
}

export interface PomodoroSettings {
  studyDuration: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
}

interface StudyStore {
  weeklyPlan: DayPlan[];
  dailyLogs: DailyLog[];
  currentWeekStart: Date;
  streak: number;
  lastStudyDate: string | null;
  pomodoroSettings: PomodoroSettings;
  totalPomodoroMinutesToday: number;
  lastPomodoroDate: string | null;
  
  // Actions
  initializeWeek: () => void;
  resetWeek: () => void;
  addSession: (dayId: string, session: Omit<StudySession, 'id'>) => void;
  updateSession: (dayId: string, sessionId: string, updates: Partial<StudySession>) => void;
  deleteSession: (dayId: string, sessionId: string) => void;
  toggleSessionComplete: (dayId: string, sessionId: string) => void;
  logDaily: (dayId: string) => void;
  updateStreak: () => void;
  setPomodoroSettings: (settings: PomodoroSettings) => void;
  addPomodoroTime: (minutes: number) => void;
  getTodayIndex: () => number;
  getStats: () => { 
    totalHours: number; 
    totalTests: number; 
    avgCompletion: number;
    subjectStats: Record<string, { hours: number; tests: number; sessions: number }>;
  };
}

const PERSIAN_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

const SUBJECT_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'
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
        }));
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

        const newLog: DailyLog = {
          id: generateId(),
          date: new Date().toISOString(),
          totalStudyHours,
          totalTests,
          completedSessions,
          totalSessions,
          overallScore,
          feedback,
        };

        set((state) => ({
          dailyLogs: [...state.dailyLogs, newLog],
        }));
        
        // Update streak
        get().updateStreak();
      },

      setPomodoroSettings: (settings) => {
        set({ pomodoroSettings: settings });
      },

      addPomodoroTime: (minutes) => {
        const today = new Date().toDateString();
        const state = get();
        
        // Reset if new day
        if (state.lastPomodoroDate !== today) {
          set({ totalPomodoroMinutesToday: minutes, lastPomodoroDate: today });
        } else {
          set({ totalPomodoroMinutesToday: state.totalPomodoroMinutesToday + minutes });
        }
        
        // Add to today's study time for the first session
        const todayIndex = get().getTodayIndex();
        const todayPlan = state.weeklyPlan[todayIndex];
        if (todayPlan && todayPlan.sessions.length > 0) {
          const firstSession = todayPlan.sessions[0];
          get().updateSession(todayPlan.id, firstSession.id, {
            actualHours: formatNumber(firstSession.actualHours + (minutes / 60)),
          });
        }
        
        // Update streak
        get().updateStreak();
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
    }
  )
);
