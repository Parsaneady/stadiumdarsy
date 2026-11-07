import { Library, Network, CalendarDays, Target, BarChart3, ScrollText } from 'lucide-react';
import SectionPage from './SectionPage';

const S = {
  library: { eyebrow: 'رختکن دانش', title: 'کتابخانه', subtitle: 'کتاب‌های رسمی پایه و رشته‌ات.', icon: Library, emptyTitle: 'کتابخانه خالی است', emptyText: 'بارگذاری PDF و متن در مرحله‌ی بعد فعال می‌شود. پایه و رشته‌ات را انتخاب کن.', to: '/settings', cta: 'تنظیمات' },
  topics: { eyebrow: 'زمین بازی', title: 'نقشه مباحث', subtitle: 'درس‌ها، مباحث و زیرمباحث روی یک نقشه‌ی تعاملی با رنگ تسلط.', icon: Network, emptyTitle: 'نقشه هنوز خالی است', emptyText: 'با اضافه شدن اولین کتاب، مباحث روی نقشه ظاهر می‌شوند.', to: '/library', cta: 'رفتن به کتابخانه' },
  planner: { eyebrow: 'تقویم مسابقات', title: 'برنامه‌ریز', subtitle: 'برنامه‌ی روزانه و هفتگی با تقویم شمسی و تکرار فاصله‌دار.', icon: CalendarDays, emptyTitle: 'برنامه‌ای ساخته نشده', emptyText: 'بعد از تقسیم درس‌ها به مباحث، هوش مصنوعی برنامه را می‌سازد.', to: '/library', cta: 'شروع از کتابخانه' },
  practice: { eyebrow: 'تمرین', title: 'تمرین و آزمون', subtitle: 'آزمون مبحثی، ترکیبی، آزمون زمان‌دار و مرور غلط‌ها.', icon: Target, emptyTitle: 'هنوز سؤالی نیست', emptyText: 'سؤال‌ها از روی مباحث کتاب‌هایت ساخته می‌شوند.', to: '/library', cta: 'رفتن به کتابخانه' },
  analytics: { eyebrow: 'تابلوی امتیاز', title: 'تحلیل عملکرد', subtitle: 'تسلط هر مبحث، دقت در طول زمان، زمان مطالعه و پیش‌بینی آمادگی.', icon: BarChart3, emptyTitle: 'داده‌ای برای تحلیل نیست', emptyText: 'بعد از اولین تمرین، نمودارها اینجا زنده می‌شوند.', to: '/practice', cta: 'رفتن به تمرین' },
  'exam-style': { eyebrow: 'الگوی آزمون', title: 'سبک آزمون', subtitle: 'الگوی آزمون هدفت را تعریف کن تا سؤال‌ها به همان سبک ساخته شوند.', icon: ScrollText, emptyTitle: 'الگویی تعریف نشده', emptyText: 'ساخت الگوی آزمون همراه با موتور سؤال‌سازی فعال می‌شود.', to: '/practice', cta: 'رفتن به تمرین' },
} as const;

export default function ArenaSections({ section }: { section: keyof typeof S }) {
  return <SectionPage {...S[section]} />;
}
