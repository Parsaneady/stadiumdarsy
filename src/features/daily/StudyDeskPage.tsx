import {Link} from 'react-router-dom';
import {CalendarDays,BookOpen,TreePine,ClipboardList,FileText,Library,Network,LayoutDashboard,Timer,History} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function StudyDeskPage(){return <div><p className="text-muted-foreground text-sm">دوازدهم علوم تجربی</p><h1 className="font-display text-4xl mt-2 mb-8">میز مطالعه</h1><div className="grid sm:grid-cols-2 gap-3">{[
 ['/weekly-plan','برنامه هفتگی',CalendarDays],['/','لقمه‌ها و ثبت روزانه',ClipboardList],['/exam','آزمون و پاسخ‌برگ',FileText],['/test-book','کتاب‌های تست',BookOpen],['/discipline-tree','درخت دیسیپلین',TreePine],['/library','کتابخانه',Library],['/topics','نقشه مباحث',Network],['/stadium','استادیوم',LayoutDashboard],['/history','تاریخچه عملکرد',History],['/daily-log-classic','ساعت روز و گزارش تصویری',Timer]
].map(([path,label,Icon])=>{const I=Icon as typeof Timer;return <Button asChild variant="outline" className="h-24 justify-start gap-5 px-5 text-lg rounded-lg" key={String(path)}><Link to={String(path)}><I size={26} className="text-primary"/>{String(label)}</Link></Button>;})}</div></div>;}
