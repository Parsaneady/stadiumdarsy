import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/features/shell/uiStore';
import { PageHeader, Panel } from '@/features/shell/primitives';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GRADES, FIELDS, gradeLabel, needsField } from '@/features/curriculum/data';

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { theme, setTheme } = useUI();
  const [name, setName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const p = profile as any;
  const [grade, setGrade] = useState<number | null>(p?.grade ?? null);
  const [field, setField] = useState<string | null>(p?.field ?? null);
  const saveStudy = async (g: number | null, f: string | null) => {
    setGrade(g); setField(f);
    const { error } = await updateProfile({ grade: g, field: needsField(g) ? f : null, onboarded: !!g && (!needsField(g) || !!f) } as any);
    error ? toast.error('ذخیره نشد، دوباره امتحان کن') : toast.success('پایه و رشته ذخیره شد');
  };

  const save = async () => {
    setSaving(true);
    const { error } = await updateProfile({ display_name: name.trim() || null });
    setSaving(false);
    error ? toast.error('ذخیره نشد، دوباره امتحان کن') : toast.success('پروفایل ذخیره شد');
  };

  return (
    <div>
      <PageHeader eyebrow="رختکن" title="تنظیمات" subtitle="پروفایل و ظاهر برنامه. تاریخ آزمون و ساعت مطالعه روزانه در مرحله‌ی برنامه‌ریز اضافه می‌شود." />
      <div className="grid md:grid-cols-2 gap-5">
        <Panel>
          <h2 className="font-display text-2xl mb-4">پروفایل</h2>
          <Label htmlFor="dn">نام نمایشی</Label>
          <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 mb-4 h-12 rounded-xl bg-muted/50" maxLength={60} />
          <Button onClick={save} disabled={saving} className="h-11 rounded-xl arena-gradient text-primary-foreground font-bold">{saving ? 'در حال ذخیره…' : 'ذخیره'}</Button>
        </Panel>
        <Panel className="md:col-span-2">
          <h2 className="font-display text-2xl mb-4">پایه و رشته</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4" role="radiogroup" aria-label="پایه">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={grade === g} onClick={() => saveStudy(g, field)}
                className={cn('h-14 rounded-2xl border font-bold transition', grade === g ? 'arena-gradient text-primary-foreground border-transparent' : 'border-border hover:bg-muted/60')}>{gradeLabel(g)}</button>
            ))}
          </div>
          {needsField(grade) && (
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="رشته">
              {FIELDS.map((f) => (
                <button key={f.id} role="radio" aria-checked={field === f.id} onClick={() => saveStudy(grade, f.id)}
                  className={cn('h-14 rounded-2xl border font-bold transition', field === f.id ? 'arena-gradient text-primary-foreground border-transparent' : 'border-border hover:bg-muted/60')}>{f.title}</button>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">پوشش مباحث: دوازدهم تجربی کامل است؛ بقیه پایه‌ها به‌زودی اضافه می‌شوند.</p>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl mb-4">پوسته</h2>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="انتخاب پوسته">
            {([['dark', 'تیره', Moon], ['light', 'روشن', Sun]] as const).map(([v, l, Icon]) => (
              <button key={v} role="radio" aria-checked={theme === v} onClick={() => setTheme(v)}
                className={cn('h-24 rounded-2xl border flex flex-col items-center justify-center gap-2 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  theme === v ? 'arena-gradient text-primary-foreground border-transparent arena-glow' : 'border-border hover:bg-muted/60')}>
                <Icon className="w-6 h-6" aria-hidden />{l}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
