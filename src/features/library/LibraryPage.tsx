import { useState } from 'react';
import { BookOpen, ChevronDown, Library } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Panel, EmptyState } from '@/features/shell/primitives';
import { getCurriculum, gradeLabel, fieldLabel, needsField } from '@/features/curriculum/data';
import { fa } from '@/lib/arena/format';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
  const { profile } = useAuth();
  const p = profile as any;
  const [open, setOpen] = useState<string | null>(null);
  const grade: number | undefined = p?.grade ?? undefined;
  const field: string | undefined = p?.field ?? undefined;
  const cur = getCurriculum(grade, field);
  const label = grade ? `پایه ${gradeLabel(grade)}${needsField(grade) && field ? ' · ' + fieldLabel(field) : ''}` : '';

  if (!grade || (needsField(grade) && !field))
    return <div><PageHeader eyebrow="رختکن دانش" title="کتابخانه" /><Panel><EmptyState icon={Library} title="پایه و رشته‌ات را انتخاب کن" text="کتاب‌ها و مباحث رسمی پایه‌ات به‌صورت خودکار اینجا می‌آیند." to="/settings" cta="انتخاب پایه و رشته" /></Panel></div>;

  if (!cur)
    return <div><PageHeader eyebrow="رختکن دانش" title="کتابخانه" subtitle={label} /><Panel><EmptyState icon={Library} title="به‌زودی" text={`مباحث ${label} در حال آماده‌سازی است. فعلاً دوازدهم تجربی کامل است.`} to="/settings" cta="تغییر پایه" /></Panel></div>;

  return (
    <div>
      <PageHeader eyebrow="رختکن دانش" title="کتابخانه" subtitle={`${label} · ${fa(cur.books.length)} کتاب`} />
      <div className="grid gap-4">
        {cur.books.map((b) => {
          const topics = b.lessons.reduce((s, l) => s + l.topics.length, 0);
          const isOpen = open === b.id;
          return (
            <Panel key={b.id} className="p-0 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : b.id)} aria-expanded={isOpen} className="w-full flex items-center gap-4 p-5 text-right">
                <span className="w-12 h-12 rounded-2xl grid place-items-center shrink-0" style={{ background: `hsl(${b.color} / .2)`, color: `hsl(${b.color})` }}><BookOpen className="w-6 h-6" aria-hidden /></span>
                <span className="flex-1">
                  <span className="block font-display text-xl">{b.title}</span>
                  <span className="text-sm text-muted-foreground">{fa(b.lessons.length)} فصل · {fa(topics)} مبحث</span>
                </span>
                <ChevronDown className={cn('w-5 h-5 transition', isOpen && 'rotate-180')} aria-hidden />
              </button>
              {isOpen && (
                <ol className="border-t border-border p-5 grid gap-4">
                  {b.lessons.map((l, i) => (
                    <li key={l.title}>
                      <p className="font-bold mb-2">فصل {fa(i + 1)}: {l.title}{l.needsReview && <span className="text-xs text-muted-foreground font-normal"> (نیاز به بازبینی)</span>}</p>
                      <div className="flex flex-wrap gap-2">
                        {l.topics.map((t) => <span key={t} className="text-sm px-3 py-1.5 rounded-xl bg-muted/60 border border-border">{t}</span>)}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
