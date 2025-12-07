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

interface StudyStore {
  weeklyPlan: DayPlan[];
  dailyLogs: DailyLog[];
  currentWeekStart: Date;
  
  // Actions
  initializeWeek: () => void;
  addSession: (dayId: string, session: Omit<StudySession, 'id'>) => void;
  updateSession: (dayId: string, sessionId: string, updates: Partial<StudySession>) => void;
  deleteSession: (dayId: string, sessionId: string) => void;
  toggleSessionComplete: (dayId: string, sessionId: string) => void;
  logDaily: (dayId: string) => void;
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
  if (score >= 60) return '💪 خوب بود! با کمی تلاش بیشتر میتونی بهتر بشی!';
  if (score >= 40) return '📚 نیاز به تمرکز بیشتر داری. فردا قوی‌تر برگرد!';
  return '🎯 امروز سخت بود، اما فردا روز جدیدی است!';
};

const createDefaultSessions = (dayIndex: number): StudySession[] => {
  const subjects = ['ریاضی', 'فیزیک', 'شیمی', 'زبان انگلیسی', 'ادبیات'];
  const sessionCount = dayIndex === 6 ? 2 : 3; // جمعه کمتر
  
  return subjects.slice(0, sessionCount).map((subject, index) => ({
    id: generateId(),
    subject,
    targetHours: 1.5 + Math.random() * 1,
    targetTests: Math.floor(5 + Math.random() * 10),
    actualHours: 0,
    actualTests: 0,
    completed: false,
    completionPercent: 0,
    notes: '',
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
  }));
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      weeklyPlan: [],
      dailyLogs: [],
      currentWeekStart: new Date(),

      initializeWeek: () => {
        const weeklyPlan: DayPlan[] = PERSIAN_DAYS.map((dayName, dayIndex) => ({
          id: generateId(),
          dayName,
          dayIndex,
          sessions: createDefaultSessions(dayIndex),
        }));
        set({ weeklyPlan, currentWeekStart: new Date() });
      },

      addSession: (dayId, session) => {
        set((state) => ({
          weeklyPlan: state.weeklyPlan.map((day) =>
            day.id === dayId
              ? { ...day, sessions: [...day.sessions, { ...session, id: generateId() }] }
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
                    s.id === sessionId ? { ...s, ...updates } : s
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
      },

      logDaily: (dayId) => {
        const state = get();
        const day = state.weeklyPlan.find((d) => d.id === dayId);
        if (!day) return;

        const totalStudyHours = day.sessions.reduce((sum, s) => sum + s.actualHours, 0);
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
          totalHours,
          totalTests,
          avgCompletion: sessionCount > 0 ? totalCompletion / sessionCount : 0,
          subjectStats,
        };
      },
    }),
    {
      name: 'study-planner-storage',
    }
  )
);
