import { forwardRef } from 'react';
import { Award, BookOpenCheck, CheckCircle2, FileQuestion, FlaskConical, Sparkles, Target } from 'lucide-react';
import summerTreeAsset from '@/assets/summer-performance-tree.png.asset.json';

interface PerformanceSubject {
  name: string;
  tests: number;
  completed: boolean;
}

interface DailyPerformanceCardProps {
  displayName: string;
  dayName: string;
  dateLabel: string;
  studyTime: string;
  totalTests: number;
  examCount: number;
  completedSessions: number;
  totalSessions: number;
  completionPercent: number;
  overallScore: number;
  quote: string;
  subjects: PerformanceSubject[];
}

const DailyPerformanceCard = forwardRef<HTMLDivElement, DailyPerformanceCardProps>(({
  displayName,
  dayName,
  dateLabel,
  studyTime,
  totalTests,
  examCount,
  completedSessions,
  totalSessions,
  completionPercent,
  overallScore,
  quote,
  subjects,
}, ref) => (
  <div
    ref={ref}
    dir="rtl"
    className="relative w-[720px] min-h-[900px] overflow-hidden bg-background text-foreground p-12 font-vazir"
  >
    <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-l from-primary via-warning to-secondary" />
    <div className="absolute -left-28 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
    <div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

    <div className="relative z-10">
      <header className="flex items-start justify-between gap-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            ثمره‌ی تلاش امروز
          </div>
          <h2 className="text-4xl font-extrabold leading-tight">عملکرد روزانه‌ی {displayName}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{dayName} · {dateLabel}</p>
        </div>
        <div className="relative h-40 w-40 shrink-0">
          <div className="absolute inset-4 rounded-full bg-success/20 blur-2xl" />
          <img
            src={summerTreeAsset.url}
            alt="درخت سرسبز تابستانی"
            width={1024}
            height={1024}
            className="relative h-full w-full object-contain drop-shadow-xl"
          />
        </div>
      </header>

      <section className="mt-10 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-primary/20 bg-card/80 p-6">
          <BookOpenCheck className="mb-5 h-7 w-7 text-primary" />
          <p className="text-sm text-muted-foreground">مطالعه مفید</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{studyTime}</p>
          <p className="mt-1 text-sm text-muted-foreground">ساعت و دقیقه</p>
        </div>
        <div className="rounded-lg border border-secondary/20 bg-card/80 p-6">
          <FileQuestion className="mb-5 h-7 w-7 text-secondary" />
          <p className="text-sm text-muted-foreground">تست‌های ثبت‌شده</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{totalTests.toLocaleString('fa-IR')}</p>
          <p className="mt-1 text-sm text-muted-foreground">تست حل‌شده امروز</p>
        </div>
        <div className="rounded-lg border border-warning/20 bg-card/80 p-6">
          <FlaskConical className="mb-5 h-7 w-7 text-warning" />
          <p className="text-sm text-muted-foreground">آزمون‌های امروز</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{examCount.toLocaleString('fa-IR')}</p>
          <p className="mt-1 text-sm text-muted-foreground">آزمون ثبت‌شده</p>
        </div>
        <div className="rounded-lg border border-success/20 bg-card/80 p-6">
          <CheckCircle2 className="mb-5 h-7 w-7 text-success" />
          <p className="text-sm text-muted-foreground">جلسات تکمیل‌شده</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{completedSessions.toLocaleString('fa-IR')} از {totalSessions.toLocaleString('fa-IR')}</p>
          <p className="mt-1 text-sm text-muted-foreground">بر اساس هدف هر جلسه</p>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-primary/20 bg-gradient-to-l from-primary/15 to-secondary/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-7 w-7 text-primary" />
            <div>
              <p className="font-bold">تکمیل برنامه</p>
              <p className="text-sm text-muted-foreground">پیشرفت هدف‌های امروز</p>
            </div>
          </div>
          <span className="text-4xl font-black text-primary">{completionPercent.toLocaleString('fa-IR')}٪</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-l from-primary to-secondary" style={{ width: `${completionPercent}%` }} />
        </div>
      </section>

      <section className="mt-5 flex items-center gap-5 rounded-lg border border-warning/20 bg-warning/10 p-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-warning/30 bg-background">
          <div className="text-center">
            <Award className="mx-auto h-5 w-5 text-warning" />
            <span className="text-2xl font-black">{overallScore.toLocaleString('fa-IR')}</span>
          </div>
        </div>
        <div>
          <p className="font-bold text-warning">امتیاز عملکرد امروز</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">ترکیبی از ساعت مطالعه، تست‌زنی و تکمیل برنامه</p>
        </div>
      </section>

      {subjects.length > 0 && (
        <section className="mt-5">
          <p className="mb-3 text-sm font-bold text-muted-foreground">درس‌های امروز</p>
          <div className="flex flex-wrap gap-2">
            {subjects.slice(0, 6).map((subject) => (
              <span key={subject.name} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
                {subject.completed && <CheckCircle2 className="h-4 w-4 text-success" />}
                {subject.name}
                {subject.tests > 0 && <span className="text-muted-foreground">· {subject.tests.toLocaleString('fa-IR')} تست</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-border pt-6 text-center">
        <p className="text-xl font-bold leading-9">«{quote}»</p>
        <p className="mt-3 text-sm font-semibold text-primary">استادیوم درسی · هر روز یک قدم رو به جلو</p>
      </footer>
    </div>
  </div>
));

DailyPerformanceCard.displayName = 'DailyPerformanceCard';

export default DailyPerformanceCard;