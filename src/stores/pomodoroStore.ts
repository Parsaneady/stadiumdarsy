import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  currentCycle: number;
  completedPomodoros: number;
  pomodoroSubject: string | null;
  
  // Actions
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number) => void;
  decrementTime: () => void;
  setIsRunning: (running: boolean) => void;
  setCurrentCycle: (cycle: number) => void;
  incrementCycle: () => void;
  incrementCompletedPomodoros: () => void;
  setPomodoroSubject: (subject: string | null) => void;
  resetTimer: (duration: number) => void;
  resetForNewDay: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      mode: 'study',
      timeLeft: 25 * 60,
      isRunning: false,
      currentCycle: 1,
      completedPomodoros: 0,
      pomodoroSubject: null,
      
      setMode: (mode) => set({ mode }),
      setTimeLeft: (time) => set({ timeLeft: time }),
      decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
      setIsRunning: (running) => set({ isRunning: running }),
      setCurrentCycle: (cycle) => set({ currentCycle: cycle }),
      incrementCycle: () => set((state) => ({ currentCycle: state.currentCycle + 1 })),
      incrementCompletedPomodoros: () => set((state) => ({ completedPomodoros: state.completedPomodoros + 1 })),
      setPomodoroSubject: (subject) => set({ pomodoroSubject: subject }),
      resetTimer: (duration) => set({ timeLeft: duration, isRunning: false }),
      resetForNewDay: () => set({ completedPomodoros: 0 }),
    }),
    {
      name: 'pomodoro-timer-storage',
      partialize: (state) => ({
        mode: state.mode,
        timeLeft: state.timeLeft,
        currentCycle: state.currentCycle,
        completedPomodoros: state.completedPomodoros,
        pomodoroSubject: state.pomodoroSubject,
      }),
    }
  )
);
