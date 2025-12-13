import { useState, useMemo, memo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, CheckCircle2, XCircle, Target, StickyNote, BookOpen, Star, Plus, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStudyStore, DailyLog, CalendarEvent } from '@/stores/studyStore';
import { formatHoursDisplay } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

// Persian calendar utilities
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert Gregorian to Persian (Jalali) calendar
const gregorianToPersian = (gy: number, gm: number, gd: number): [number, number, number] => {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy = (gy <= 1600) ? gy - 621 : gy - 1600;
  const gy2 = (gm > 2) ? gy + 1 : gy;
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) 
    + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
};

// Convert Persian to Gregorian
const persianToGregorian = (jy: number, jm: number, jd: number): [number, number, number] => {
  let gy = (jy <= 979) ? 621 : 1600;
  jy = (jy <= 979) ? jy : jy - 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) 
    + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let v = gd;
  for (gm = 0; gm < 13 && v > sal_a[gm]; gm++) v -= sal_a[gm];
  return [gy, gm, v];
};

// Get days in Persian month
const getPersianMonthDays = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = ((year - (year > 0 ? 474 : 473)) % 2820 + 474 + 38) * 682 % 2816 < 682;
  return isLeap ? 30 : 29;
};

// Get day of week for first day of Persian month (0 = Saturday)
const getFirstDayOfPersianMonth = (year: number, month: number): number => {
  const [gy, gm, gd] = persianToGregorian(year, month, 1);
  const date = new Date(gy, gm - 1, gd);
  const jsDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  // Convert to Persian week (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
  return (jsDay + 1) % 7;
};

// Format date key for matching logs - use local date to avoid timezone issues
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  log: DailyLog | null;
  event: CalendarEvent | null;
  onClick: () => void;
  isSelected: boolean;
}

const CalendarDay = memo(({ day, isToday, log, event, onClick, isSelected }: CalendarDayProps) => {
  const hasLog = !!log;
  const hasEvent = !!event;
  const score = log?.overallScore ?? 0;
  
  let bgColor = 'bg-background/30';
  let borderColor = 'border-transparent';
  
  if (hasLog) {
    if (score >= 75) {
      bgColor = 'bg-success/20';
      borderColor = 'border-success/50';
    } else if (score >= 50) {
      bgColor = 'bg-warning/20';
      borderColor = 'border-warning/50';
    } else {
      bgColor = 'bg-destructive/20';
      borderColor = 'border-destructive/50';
    }
  }
  
  if (isSelected) {
    borderColor = 'border-primary';
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'aspect-square w-full rounded-lg border-2 transition-all duration-200 relative',
        'flex flex-col items-center justify-center gap-0.5',
        'hover:scale-105 hover:shadow-lg',
        bgColor,
        borderColor,
        isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        hasEvent && 'shadow-[0_0_15px_rgba(234,179,8,0.5)] border-amber-400/70'
      )}
    >
      {hasEvent && (
        <div className="absolute -top-1 -right-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
        </div>
      )}
      <span className={cn(
        'text-sm font-medium',
        isToday ? 'text-primary' : hasEvent ? 'text-amber-400' : 'text-foreground'
      )}>
        {day}
      </span>
      {hasLog && (
        <div className={cn(
          'w-1.5 h-1.5 rounded-full',
          score >= 75 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive'
        )} />
      )}
    </button>
  );
});

CalendarDay.displayName = 'CalendarDay';

const PerformanceHistory = () => {
  const { dailyLogs, calendarEvents, addCalendarEvent, deleteCalendarEvent } = useStudyStore();
  
  const today = new Date();
  const [currentPersianYear, currentPersianMonth, currentPersianDay] = gregorianToPersian(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  
  const [viewYear, setViewYear] = useState(currentPersianYear);
  const [viewMonth, setViewMonth] = useState(currentPersianMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Create a map of logs by date for quick lookup
  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    dailyLogs.forEach(log => {
      const date = new Date(log.date);
      const key = formatDateKey(date);
      if (!map.has(key) || new Date(map.get(key)!.date) < new Date(log.date)) {
        map.set(key, log);
      }
    });
    return map;
  }, [dailyLogs]);
  
  // Create a map of events by date for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    calendarEvents.forEach(event => {
      const key = `${event.persianDate.year}-${event.persianDate.month}-${event.persianDate.day}`;
      map.set(key, event);
    });
    return map;
  }, [calendarEvents]);
  
  const daysInMonth = getPersianMonthDays(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfPersianMonth(viewYear, viewMonth);
  
  const todayPersian = gregorianToPersian(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const isToday = (day: number) => 
    viewYear === todayPersian[0] && viewMonth === todayPersian[1] && day === todayPersian[2];
  
  const getLogForDay = (day: number): DailyLog | null => {
    const [gy, gm, gd] = persianToGregorian(viewYear, viewMonth, day);
    const date = new Date(gy, gm - 1, gd);
    const key = formatDateKey(date);
    return logsByDate.get(key) || null;
  };
  
  const getEventForDay = (day: number): CalendarEvent | null => {
    const key = `${viewYear}-${viewMonth}-${day}`;
    return eventsByDate.get(key) || null;
  };
  
  const selectedLog = selectedDay ? getLogForDay(selectedDay) : null;
  const selectedEvent = selectedDay ? getEventForDay(selectedDay) : null;
  
  const handleAddEvent = () => {
    if (!selectedDay || !eventTitle.trim()) return;
    
    const [gy, gm, gd] = persianToGregorian(viewYear, viewMonth, selectedDay);
    const date = new Date(gy, gm - 1, gd);
    
    addCalendarEvent({
      title: eventTitle.trim(),
      date: date.toISOString(),
      persianDate: { year: viewYear, month: viewMonth, day: selectedDay },
    });
    
    setEventTitle('');
    setIsAddEventOpen(false);
  };
  
  const handleDeleteEvent = (eventId: string) => {
    deleteCalendarEvent(eventId);
  };
  
  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      if (viewYear > 1400) {
        setViewYear(viewYear - 1);
        setViewMonth(12);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };
  
  const goToNextMonth = () => {
    if (viewMonth === 12) {
      if (viewYear < 1410) {
        setViewYear(viewYear + 1);
        setViewMonth(1);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  };
  
  const goToToday = () => {
    setViewYear(currentPersianYear);
    setViewMonth(currentPersianMonth);
    setSelectedDay(todayPersian[2]);
  };
  
  const canGoPrev = viewYear > 1400 || (viewYear === 1400 && viewMonth > 1);
  const canGoNext = viewYear < 1410 || (viewYear === 1410 && viewMonth < 12);
  
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [firstDayOffset, daysInMonth]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">تاریخچه عملکرد</h1>
          <p className="text-muted-foreground mt-1">مرور عملکرد روزانه در تقویم</p>
        </div>
        <Button onClick={goToToday} variant="outline" className="gap-2">
          <CalendarIcon className="w-4 h-4" />
          امروز
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <GlassCard className="lg:col-span-2 p-6">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              disabled={!canGoPrev}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <h2 className="text-xl font-bold">
              {PERSIAN_MONTHS[viewMonth - 1]} {viewYear}
            </h2>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              disabled={!canGoNext}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2" dir="rtl">
            {PERSIAN_WEEKDAYS.map((day, i) => (
              <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2" dir="rtl">
            {calendarDays.map((day, i) => (
              <div key={i} className="aspect-square">
                {day !== null ? (
                  <CalendarDay
                    day={day}
                    isToday={isToday(day)}
                    log={getLogForDay(day)}
                    event={getEventForDay(day)}
                    onClick={() => setSelectedDay(day)}
                    isSelected={selectedDay === day}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>عالی (۷۵٪+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>متوسط (۵۰-۷۵٪)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>نیاز به بهبود (&lt;۵۰٪)</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>رویداد</span>
            </div>
          </div>
        </GlassCard>
        
        {/* Day Details */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            جزئیات روز
          </h3>
          
          {selectedDay ? (
            <div className="space-y-4">
              {/* Date */}
              <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-lg font-bold text-primary">
                  {selectedDay} {PERSIAN_MONTHS[viewMonth - 1]} {viewYear}
                </p>
              </div>
              
              {/* Event Section */}
              {selectedEvent ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-amber-400">رویداد</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-medium">{selectedEvent.title}</p>
                </div>
              ) : (
                <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 border-dashed border-amber-400/50 text-amber-400 hover:bg-amber-400/10">
                      <Plus className="w-4 h-4" />
                      افزودن رویداد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-right">افزودن رویداد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground text-right">
                        {selectedDay} {PERSIAN_MONTHS[viewMonth - 1]} {viewYear}
                      </p>
                      <Input
                        placeholder="عنوان رویداد (مثلاً: آزمون جامع)"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="text-right"
                        dir="rtl"
                      />
                      <Button onClick={handleAddEvent} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        ذخیره رویداد
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {selectedLog ? (
                <>
                  {/* Score */}
                  <div className="text-center">
                    <div className={cn(
                      'inline-block px-4 py-2 rounded-full text-lg font-bold',
                      selectedLog.overallScore >= 75 ? 'bg-success/20 text-success' :
                      selectedLog.overallScore >= 50 ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    )}>
                      امتیاز: {Math.round(selectedLog.overallScore)}٪
                    </div>
                  </div>
                  
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-secondary/10 text-center">
                      <p className="text-muted-foreground">ساعت مطالعه</p>
                      <p className="font-bold text-secondary">{formatHoursDisplay(selectedLog.totalStudyHours)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 text-center">
                      <p className="text-muted-foreground">تعداد تست</p>
                      <p className="font-bold text-accent">{selectedLog.totalTests}</p>
                    </div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm">{selectedLog.feedback}</p>
                  </div>
                  
                  {/* Sessions */}
                  {selectedLog.sessions && selectedLog.sessions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">جزئیات دروس</h4>
                      {selectedLog.sessions.map((session, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-background/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: session.color }}
                              />
                              <span className="font-medium text-sm">{session.subject}</span>
                            </div>
                            {session.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive/50" />
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            هدف: {formatHoursDisplay(session.targetHours)} • {session.targetTests} تست
                          </div>
                          
                          <div className="text-xs text-foreground">
                            انجام شده: {formatHoursDisplay(session.actualHours)} • {session.actualTests} تست
                          </div>
                          
                          {session.notes && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                              <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                              <p>{session.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">ثبت عملکردی برای این روز وجود ندارد</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>یک روز را از تقویم انتخاب کنید</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default PerformanceHistory;