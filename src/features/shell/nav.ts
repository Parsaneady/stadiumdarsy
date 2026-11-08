import { Sun, BookOpen, FileText, MessageCircle, BarChart3, Users, Settings, type LucideIcon } from 'lucide-react';
export interface NavItem { path:string;label:string;short:string;icon:LucideIcon;mobile?:boolean }
export const NAV:NavItem[]=[
 {path:'/',label:'امروز',short:'امروز',icon:Sun,mobile:true},
 {path:'/study-desk',label:'میز مطالعه',short:'میز مطالعه',icon:BookOpen,mobile:true},
 {path:'/exam',label:'آزمون‌ها',short:'آزمون‌ها',icon:FileText,mobile:true},
 {path:'/advisor',label:'مشاور',short:'مشاور',icon:MessageCircle,mobile:true},
 {path:'/analytics',label:'تحلیل',short:'تحلیل',icon:BarChart3,mobile:true},
 {path:'/pension',label:'پانسیون',short:'پانسیون',icon:Users,mobile:true},
 {path:'/settings',label:'تنظیمات',short:'تنظیمات',icon:Settings,mobile:true},
];
