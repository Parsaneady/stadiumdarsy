// Convert hours (decimal) to hours and minutes
export const hoursToHoursMinutes = (totalHours: number): { hours: number; minutes: number } => {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return { hours, minutes };
};

// Convert hours and minutes to total hours (decimal)
export const hoursMinutesToHours = (hours: number, minutes: number): number => {
  return hours + (minutes / 60);
};

// Format hours to display string (e.g., "۲:۳۰" or "۲" for whole hours)
export const formatHoursDisplay = (totalHours: number): string => {
  const { hours, minutes } = hoursToHoursMinutes(totalHours);
  
  if (hours === 0 && minutes === 0) return '۰';
  if (hours === 0) return `۰:${minutes.toString().padStart(2, '0')}`;
  if (minutes === 0) return `${hours}`;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Format for short display (charts, etc.) - always H:MM format
export const formatHoursShort = (totalHours: number): string => {
  if (totalHours === 0) return '0';
  const { hours, minutes } = hoursToHoursMinutes(totalHours);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Generate nice tick values for chart Y-axis based on max value
export const generateTimeTicks = (maxValue: number): number[] => {
  if (maxValue <= 0) return [0];
  
  // Define nice intervals in hours
  const niceIntervals = [0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12];
  
  // Find the best interval that gives 3-6 ticks
  let bestInterval = 0.5;
  for (const interval of niceIntervals) {
    const tickCount = Math.ceil(maxValue / interval) + 1;
    if (tickCount >= 3 && tickCount <= 6) {
      bestInterval = interval;
      break;
    }
    if (tickCount < 3) {
      bestInterval = interval;
    }
  }
  
  // Generate ticks from 0 to just above maxValue
  const ticks: number[] = [];
  for (let i = 0; i <= Math.ceil(maxValue / bestInterval); i++) {
    ticks.push(i * bestInterval);
  }
  
  return ticks;
};

// Convert Persian numerals to English
export const persianToEnglish = (str: string): string => {
  const persianNums = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (d) => persianNums.indexOf(d).toString());
};

// Get effective date considering 3 AM boundary
// Before 3 AM, we still consider it the previous day
export const getEffectiveDate = (): Date => {
  const now = new Date();
  if (now.getHours() < 3) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  return now;
};

// Get effective date string (YYYY-MM-DD) considering 3 AM boundary
export const getEffectiveDateString = (): string => {
  return getEffectiveDate().toISOString().split('T')[0];
};
