import { LayoutDashboard, Library, Network, CalendarDays, Target, BarChart3, Settings, ScrollText, type LucideIcon } from 'lucide-react';

export interface NavItem { path: string; label: string; short: string; icon: LucideIcon; mobile?: boolean }

export const NAV: NavItem[] = [
  { path: '/', label: 'استادیوم', short: 'استادیوم', icon: LayoutDashboard, mobile: true },
  { path: '/library', label: 'کتابخانه', short: 'کتاب‌ها', icon: Library, mobile: true },
  { path: '/topics', label: 'نقشه مباحث', short: 'نقشه', icon: Network, mobile: true },
  { path: '/planner', label: 'برنامه‌ریز', short: 'برنامه', icon: CalendarDays, mobile: true },
  { path: '/practice', label: 'تمرین و آزمون', short: 'تمرین', icon: Target, mobile: true },
  { path: '/analytics', label: 'تحلیل عملکرد', short: 'تحلیل', icon: BarChart3 },
  { path: '/exam-style', label: 'سبک آزمون', short: 'سبک', icon: ScrollText },
  { path: '/settings', label: 'تنظیمات', short: 'تنظیمات', icon: Settings },
];

export const LEGACY_NAV = [
  { path: '/classic', label: 'داشبورد قدیمی' },
  { path: '/pension', label: 'پانسیون' },
  { path: '/daily-log', label: 'ثبت روزانه' },
  { path: '/weekly-plan', label: 'برنامه هفتگی' },
  { path: '/pomodoro', label: 'پومودورو' },
  { path: '/test-book', label: 'پاسخ‌برگ کتاب تست' },
  { path: '/exam', label: 'آزمون‌ها' },
  { path: '/discipline-tree', label: 'درخت دیسیپلین' },
  { path: '/study-desk', label: 'میز مطالعه' },
];
