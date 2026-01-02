import { useCallback, useRef, useEffect } from 'react';

// Web Audio API for generating sound
export const usePomodoroSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a simple beep sound
  const playBeep = useCallback((frequency: number = 800, duration: number = 0.3, count: number = 3) => {
    const ctx = initAudioContext();
    if (!ctx) return;

    let delay = 0;
    for (let i = 0; i < count; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
      
      // Fade in and out
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration);
      
      delay += duration + 0.15;
    }
  }, [initAudioContext]);

  // Pomodoro complete sound (success tone)
  const playPomodoroComplete = useCallback(() => {
    playBeep(880, 0.2, 2); // Higher pitched, 2 beeps
    setTimeout(() => playBeep(1046, 0.3, 1), 500); // End on a high note
  }, [playBeep]);

  // Break complete sound (reminder tone)
  const playBreakComplete = useCallback(() => {
    playBeep(660, 0.15, 3); // Lower pitched, 3 quick beeps
  }, [playBeep]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playPomodoroComplete,
    playBreakComplete,
    playBeep,
  };
};
