import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, FileText, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';

const studyDeskItems = [
  { 
    path: '/weekly-plan', 
    icon: Calendar, 
    label: 'برنامه هفتگی',
    description: 'تنظیم برنامه درسی هفتگی',
    gradient: 'from-primary to-accent'
  },
  { 
    path: '/daily-log', 
    icon: ClipboardList, 
    label: 'ثبت روزانه',
    description: 'تایمر مطالعه و ثبت فعالیت',
    gradient: 'from-warning to-accent'
  },
  { 
    path: '/exam', 
    icon: FileText, 
    label: 'پنل آزمون',
    description: 'آزمون و تصحیح پاسخ‌نامه',
    gradient: 'from-success to-primary'
  },
  { 
    path: '/pension', 
    icon: Users, 
    label: 'پانسیون',
    description: 'گروه مطالعاتی و همراهان',
    gradient: 'from-accent to-primary'
  },
];

const StudyDesk = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">میز مطالعه</h1>
          <p className="text-muted-foreground">
            ابزارهای مدیریت مطالعه خود را انتخاب کنید
          </p>
        </div>

        {/* Islands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          {studyDeskItems.map((item, index) => (
            <GlassCard key={item.path} delay={index * 0.1}>
              <button
                onClick={() => navigate(item.path)}
                className="w-full text-right p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default StudyDesk;
