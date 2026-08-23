import { forwardRef, useMemo } from 'react';
import {
  Award,
  BedDouble,
  BookOpen,
  BrainCircuit,
  Check,
  CircleDot,
  Clock3,
  Coffee,
  FileCheck2,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';

interface PerformanceSubject {
  name: string;
  tests: number;
  studyMinutes: number;
  mastery: number;
  completed: boolean;
}

interface PerformanceActivity {
  id: string;
  type: 'sleep' | 'study' | 'break' | 'free_time';
  subject?: string;
  startHour: number;
  endHour: number;
}

interface ExamPerformance {
  id: string;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percentage: number;
  previousPercentage?: number;
  occurredAt: string;
}

interface DailyPerformanceCardProps {
  displayName: string;
  dayName: string;
  dateLabel: string;
  studyTime: string;
  totalTests: number;
  completedSessions: number;
  totalSessions: number;
  completionPercent: number;
  overallScore: number;
  quote: string;
  subjects: PerformanceSubject[];
  activities: PerformanceActivity[];
  wakeUpHour?: number;
  exams: ExamPerformance[];
}

const faNumber = (value: number) => Math.round(value).toLocaleString('fa-IR');

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const polar = (cx: number, cy: number, radius: number, hour: number) => {
  const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
};

const arcPath = (start: number, end: number, inner: number, outer: number) => {
  const cx = 180;
  const cy = 180;
  let normalizedEnd = end;
  if (normalizedEnd < start) normalizedEnd += 24;
  const span = Math.min(23.999, normalizedEnd - start);
  const startPoint = polar(cx, cy, outer, start);
  const endPoint = polar(cx, cy, outer, start + span);
  const innerEnd = polar(cx, cy, inner, start + span);
  const innerStart = polar(cx, cy, inner, start);
  const large = span > 12 ? 1 : 0;
  return `M ${startPoint.x} ${startPoint.y} A ${outer} ${outer} 0 ${large} 1 ${endPoint.x} ${endPoint.y} L ${innerEnd.x} ${innerEnd.y} A ${inner} ${inner} 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`;
};

const LifeClock = ({ activities, wakeUpHour, studyTime, examTimes }: {
  activities: PerformanceActivity[];
  wakeUpHour?: number;
  studyTime: string;
  examTimes: number[];
}) => {
  const ticks = Array.from({ length: 24 }, (_, hour) => {
    const outer = polar(180, 180, 154, hour);
    const inner = polar(180, 180, hour % 3 === 0 ? 143 : 148, hour);
    const label = polar(180, 180, 169, hour);
    return { hour, outer, inner, label };
  });

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0">
        <svg width="360" height="360" viewBox="0 0 360 360" aria-label="ساعت ۲۴ ساعته فعالیت‌های روز">
          <circle cx="180" cy="180" r="156" className="fill-card/40 stroke-border" strokeWidth="2" />
          {wakeUpHour !== undefined && wakeUpHour > 0 && (
            <path d={arcPath(0, wakeUpHour, 112, 140)} className="fill-muted/80" />
          )}
          {activities.map((activity) => (
            <path
              key={activity.id}
              d={arcPath(activity.startHour, activity.endHour, 112, 140)}
              className={activity.type === 'study' ? 'fill-primary' : activity.type === 'break' ? 'fill-warning' : activity.type === 'sleep' ? 'fill-muted' : 'fill-secondary/50'}
            />
          ))}
          {ticks.map(({ hour, outer, inner, label }) => (
            <g key={hour}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="stroke-foreground/40" strokeWidth={hour % 3 === 0 ? 2 : 1} />
              {hour % 3 === 0 && <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[12px] font-bold">{hour.toLocaleString('fa-IR')}</text>}
            </g>
          ))}
          {examTimes.map((hour, index) => {
            const point = polar(180, 180, 126, hour);
            return <circle key={`${hour}-${index}`} cx={point.x} cy={point.y} r="7" className="fill-destructive stroke-background" strokeWidth="3" />;
          })}
          <circle cx="180" cy="180" r="92" className="fill-background/90 stroke-border" strokeWidth="2" />
          <text x="180" y="166" textAnchor="middle" className="fill-foreground text-[31px] font-black">{studyTime}</text>
          <text x="180" y="194" textAnchor="middle" className="fill-muted-foreground text-[13px]">مطالعهٔ خالص امروز</text>
          <circle cx="180" cy="215" r="3" className="fill-primary" />
        </svg>
      </div>
      <div className="flex-1 space-y-5">
        <div>
          <p className="text-sm font-bold text-primary">ریتم ۲۴ ساعت تو</p>
          <h3 className="mt-2 text-3xl font-black">روزت، روی یک نگاه</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" />مطالعه</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" />آزمون</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warning" />استراحت</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted" />خواب</div>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">هر حلقه یک تکه از زندگی امروز توست؛ نقطه‌های قرمز زمان ثبت آزمون‌ها را نشان می‌دهند.</p>
      </div>
    </div>
  );
};

const DailyPerformanceCard = forwardRef<HTMLDivElement, DailyPerformanceCardProps>(({
  displayName,
  dayName,
  dateLabel,
  studyTime,
  totalTests,
  completedSessions,
  totalSessions,
  completionPercent,
  overallScore,
  quote,
  subjects,
  activities,
  wakeUpHour,
  exams,
}, ref) => {
  const totals = useMemo(() => exams.reduce((result, exam) => ({
    total: result.total + exam.total,
    correct: result.correct + exam.correct,
    wrong: result.wrong + exam.wrong,
    blank: result.blank + exam.blank,
  }), { total: 0, correct: 0, wrong: 0, blank: 0 }), [exams]);
  const examSuccess = totals.total > 0 ? Math.round(((totals.correct - totals.wrong / 3) / totals.total) * 100) : 0;
  const sortedSubjects = [...subjects].sort((a, b) => b.mastery - a.mastery);
  const bestSubject = sortedSubjects[0];
  const focusSubject = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1] : undefined;
  const examTimes = exams.map((exam) => {
    const date = new Date(exam.occurredAt);
    return date.getHours() + date.getMinutes() / 60;
  });
  const coachingText = bestSubject
    ? `امروز در ${bestSubject.name} با تسلط ${faNumber(bestSubject.mastery)}٪ ریتم خوبی داشتی.${focusSubject && focusSubject.name !== bestSubject.name ? ` برای فردا، یک مرور ۳۰ دقیقه‌ای ${focusSubject.name} می‌تواند فاصله‌ات تا هدفت را کمتر کند.` : ' همین پیوستگی را فردا هم حفظ کن.'}`
    : 'امروز را ثبت کردی؛ فردا فقط کافی‌ست یک قدم کوچک و پیوسته برداری.';

  return (
    <div ref={ref} dir="rtl" className="relative h-[1920px] w-[1080px] overflow-hidden bg-background text-foreground font-vazir">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,hsl(var(--primary)/0.22),transparent_24%),radial-gradient(circle_at_12%_42%,hsl(var(--secondary)/0.14),transparent_26%),linear-gradient(155deg,hsl(var(--background)),hsl(var(--card))_58%,hsl(var(--background)))]" />
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-l from-primary via-secondary to-warning" />
      <main className="relative z-10 flex h-full flex-col px-16 py-14">
        <header className="flex min-h-[260px] items-start justify-between gap-12">
          <div className="max-w-[690px]">
            <div className="mb-6 flex items-center gap-3 text-sm font-bold text-primary">
              <Sparkles className="h-5 w-5" />
              STUDY WRAPPED · گزارش شخصی روز
            </div>
            <p className="text-xl text-muted-foreground">{dayName} · {dateLabel}</p>
            <h1 className="mt-4 text-6xl font-black leading-[1.3]">{displayName}</h1>
            <p className="mt-5 text-2xl font-semibold leading-10">«{quote}»</p>
          </div>
          <div className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/10 shadow-2xl">
            <div className="absolute inset-4 rounded-full border border-warning/30" />
            <Award className="absolute top-7 h-9 w-9 text-warning" />
            <strong className="mt-8 text-5xl font-black">{faNumber(overallScore)}</strong>
            <span className="absolute bottom-7 text-xs font-bold text-warning">از ۱۰۰</span>
          </div>
        </header>

        <section className="grid grid-cols-[1.15fr_0.85fr] gap-5">
          <div className="rounded-lg border border-primary/25 bg-card/65 p-7 backdrop-blur-xl">
            <LifeClock activities={activities} wakeUpHour={wakeUpHour} studyTime={studyTime} examTimes={examTimes} />
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-1 flex-col justify-between rounded-lg border border-secondary/25 bg-card/65 p-7 backdrop-blur-xl">
              <BookOpen className="h-8 w-8 text-secondary" />
              <div><p className="text-sm text-muted-foreground">تست‌های امروز</p><p className="mt-2 text-5xl font-black">{faNumber(totalTests)}</p></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-secondary" style={{ width: `${Math.min(100, totalTests)}%` }} /></div>
            </div>
            <div className="flex flex-1 flex-col justify-between rounded-lg border border-success/25 bg-card/65 p-7 backdrop-blur-xl">
              <Target className="h-8 w-8 text-success" />
              <div><p className="text-sm text-muted-foreground">تکمیل برنامه</p><p className="mt-2 text-5xl font-black">{faNumber(completionPercent)}٪</p></div>
              <p className="text-sm text-muted-foreground">{faNumber(completedSessions)} از {faNumber(totalSessions)} جلسه به هدف رسید</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-border bg-card/65 p-8 backdrop-blur-xl">
          <div className="flex items-end justify-between">
            <div><p className="text-sm font-bold text-secondary">TEST PERFORMANCE</p><h2 className="mt-2 text-3xl font-black">کیفیت تست‌زنی</h2></div>
            <div className="text-left"><strong className="text-5xl font-black text-secondary">{faNumber(examSuccess)}٪</strong><p className="mt-1 text-xs text-muted-foreground">با احتساب نمره منفی</p></div>
          </div>
          {totals.total > 0 ? (
            <>
              <div className="mt-7 grid grid-cols-4 gap-4">
                {[
                  { label: 'کل', value: totals.total, icon: CircleDot, tone: 'text-secondary' },
                  { label: 'درست', value: totals.correct, icon: Check, tone: 'text-success' },
                  { label: 'غلط', value: totals.wrong, icon: X, tone: 'text-destructive' },
                  { label: 'نزده', value: totals.blank, icon: Coffee, tone: 'text-warning' },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="border-r border-border pr-4 first:border-0 first:pr-0"><Icon className={`h-5 w-5 ${tone}`} /><strong className="mt-3 block text-3xl">{faNumber(value)}</strong><span className="text-sm text-muted-foreground">{label}</span></div>
                ))}
              </div>
              <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-muted">
                <div className="bg-success" style={{ width: `${(totals.correct / totals.total) * 100}%` }} />
                <div className="bg-destructive" style={{ width: `${(totals.wrong / totals.total) * 100}%` }} />
                <div className="bg-warning" style={{ width: `${(totals.blank / totals.total) * 100}%` }} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {exams.slice(0, 2).map((exam) => {
                  const delta = exam.previousPercentage === undefined ? undefined : Math.round(exam.percentage - exam.previousPercentage);
                  return <div key={exam.id} className="rounded-lg border border-border bg-background/35 p-4"><div className="flex justify-between gap-3"><p className="truncate font-bold">{exam.name}</p><span className="font-black text-secondary">{faNumber(exam.percentage)}٪</span></div>{delta !== undefined && <p className={`mt-2 text-xs ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>{delta >= 0 ? 'رشد' : 'افت'} {faNumber(Math.abs(delta))}٪ نسبت به نتیجه قبلی</p>}</div>;
                })}
              </div>
            </>
          ) : <div className="mt-7 flex items-center gap-4 rounded-lg border border-dashed border-border p-6 text-muted-foreground"><FileCheck2 className="h-8 w-8" /><p>امروز نتیجهٔ آزمون تستی ثبت نشده؛ تست‌های برنامه در آمار کلی محاسبه شده‌اند.</p></div>}
        </section>

        <section className="mt-5 rounded-lg border border-border bg-card/65 p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-primary">SUBJECT MAP</p><h2 className="mt-2 text-3xl font-black">درس‌های امروز</h2></div><Clock3 className="h-8 w-8 text-primary" /></div>
          <div className="mt-6 space-y-4">
            {subjects.length > 0 ? subjects.slice(0, 5).map((subject, index) => (
              <div key={`${subject.name}-${index}`} className="grid grid-cols-[150px_1fr_105px_95px] items-center gap-5">
                <p className="truncate font-bold">{subject.name}</p>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={index % 3 === 0 ? 'h-full bg-primary' : index % 3 === 1 ? 'h-full bg-secondary' : 'h-full bg-warning'} style={{ width: `${subject.mastery}%` }} /></div>
                <p className="text-sm text-muted-foreground">{formatMinutes(subject.studyMinutes)}</p>
                <p className="text-left text-sm">{faNumber(subject.tests)} تست</p>
              </div>
            )) : <p className="py-5 text-center text-muted-foreground">هنوز فعالیت درسی برای امروز ثبت نشده است.</p>}
          </div>
        </section>

        <section className="mt-5 grid grid-cols-[1.25fr_0.75fr] gap-5">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-8">
            <div className="flex items-center gap-3"><BrainCircuit className="h-8 w-8 text-primary" /><h2 className="text-2xl font-black">تحلیل مربی امروز</h2></div>
            <p className="mt-5 text-lg leading-9 text-foreground/90">{coachingText}</p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-8">
            <TrendingUp className="h-8 w-8 text-warning" />
            <p className="mt-5 text-sm text-muted-foreground">بهترین عملکرد</p>
            <p className="mt-2 text-2xl font-black">{bestSubject?.name || 'شروع مسیر'}</p>
            <p className="mt-3 text-sm text-muted-foreground">تسلط {faNumber(bestSubject?.mastery || 0)}٪</p>
          </div>
        </section>

        <footer className="mt-auto flex items-end justify-between border-t border-border pt-8">
          <div><p className="text-2xl font-black">امروز یک قدم نزدیک‌تر.</p><p className="mt-2 text-sm text-muted-foreground">استادیوم درسی · گزارش روزانه شخصی تو</p></div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10"><Sparkles className="h-6 w-6 text-primary" /></div>
        </footer>
      </main>
    </div>
  );
});

DailyPerformanceCard.displayName = 'DailyPerformanceCard';

export default DailyPerformanceCard;