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

// Format for short display (charts, etc.) - always HH:MM format
export const formatHoursShort = (totalHours: number): string => {
  const { hours, minutes } = hoursToHoursMinutes(totalHours);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Convert Persian numerals to English
export const persianToEnglish = (str: string): string => {
  const persianNums = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (d) => persianNums.indexOf(d).toString());
};
