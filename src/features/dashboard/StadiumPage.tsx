import { Flame, Target, Clock, BookOpen, Rocket, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { faDate } from '@/lib/arena/format';
import { PageHeader, Panel, ProgressRing, StatTile, EmptyState, ArenaLink } from '@/features/shell/primitives';

export default function StadiumPage() {
  const { profile } = useAuth();
  const name = profile?.display_name || profile?.first_name || 'قهرمان';
  return (
    <div>
      <PageHeader eyebrow={faDate()} title={`سلام ${name}`} subtitle="امروز یک مسابقه‌ی تازه است. ماموریتت را ببین و وارد زمین شو." />

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <Panel glow className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full arena-gradient opacity-20 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><Rocket className="w-4 h-4" aria-hidden />ماموریت امروز</p>
            <h2 className="font-display text-3xl mb-2">هنوز برنامه‌ای ساخته نشده</h2>
            <p className="text-muted-foreground mb-6 max-w-lg">یک کتاب یا جزوه بارگذاری کن تا هوش مصنوعی آن را به مباحث کوچک تقسیم کند و برنامه‌ی روزانه‌ات را بچیند.</p>
            <div className="flex flex-wrap gap-3"><ArenaLink to="/library"><BookOpen className="w-4 h-4" />رفتن به کتابخانه</ArenaLink><ArenaLink to="/settings" variant="ghost">تنظیم تاریخ آزمون</ArenaLink></div>
          </div>
        </Panel>
        <Panel className="flex flex-col items-center justify-center gap-3">
          <ProgressRing value={0} size={150} stroke={12} label="آمادگی" />
          <p className="text-sm text-muted-foreground text-center">آمادگی تو بعد از اولین آزمون محاسبه می‌شود.</p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatTile icon={Flame} label="رکورد برد پیاپی" value={0} suffix="روز" warm />
        <StatTile icon={Clock} label="مطالعه امروز" value={0} suffix="دقیقه" />
        <StatTile icon={Target} label="سؤال‌های حل‌شده" value={0} />
        <StatTile icon={Sparkles} label="مباحث مسلط" value={0} />
      </div>

      <Panel>
        <h2 className="font-display text-2xl mb-1 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" aria-hidden />مباحث ضعیف</h2>
        <EmptyState icon={Target} title="هنوز داده‌ای نیست" text="بعد از چند تمرین، سه مبحث ضعیفت اینجا با دکمه‌ی «درستش کن» نمایش داده می‌شوند." to="/practice" cta="رفتن به تمرین" />
      </Panel>
    </div>
  );
}
