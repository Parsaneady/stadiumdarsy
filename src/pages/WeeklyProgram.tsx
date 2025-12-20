import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Clock,
  FileText,
  Save
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  studyMinutes: number;
  testCount: number;
  completed: boolean;
}

interface DayPlan {
  id: string;
  dayName: string;
  dayIndex: number;
  tasks: Task[];
}

const PERSIAN_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

const WeeklyProgram = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWeeklyPlan();
    }
  }, [user]);

  const fetchWeeklyPlan = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('day_index');

      if (data && data.length > 0) {
        setWeeklyPlan(data.map(d => ({
          id: d.id,
          dayName: d.day_name,
          dayIndex: d.day_index,
          tasks: (d.sessions as any[])?.map(s => ({
            id: s.id || crypto.randomUUID(),
            title: s.title || s.subject || '',
            studyMinutes: s.studyMinutes || s.duration || 0,
            testCount: s.testCount || 0,
            completed: s.completed || false,
          })) || [],
        })));
      } else {
        // Initialize empty week
        await initializeWeek();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Debug]', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWeek = async () => {
    if (!user) return;

    const plans = PERSIAN_DAYS.map((dayName, dayIndex) => ({
      user_id: user.id,
      day_name: dayName,
      day_index: dayIndex,
      sessions: [] as any,
    }));

    const { data } = await supabase
      .from('weekly_plans')
      .insert(plans)
      .select();

    if (data) {
      setWeeklyPlan(data.map(d => ({
        id: d.id,
        dayName: d.day_name,
        dayIndex: d.day_index,
        tasks: [],
      })));
    }
  };

  const addTask = (dayIndex: number) => {
    setWeeklyPlan(prev => prev.map(day => {
      if (day.dayIndex === dayIndex) {
        return {
          ...day,
          tasks: [...day.tasks, {
            id: crypto.randomUUID(),
            title: '',
            studyMinutes: 0,
            testCount: 0,
            completed: false,
          }],
        };
      }
      return day;
    }));
  };

  const updateTask = (dayIndex: number, taskId: string, field: keyof Task, value: any) => {
    setWeeklyPlan(prev => prev.map(day => {
      if (day.dayIndex === dayIndex) {
        return {
          ...day,
          tasks: day.tasks.map(task => 
            task.id === taskId ? { ...task, [field]: value } : task
          ),
        };
      }
      return day;
    }));
  };

  const removeTask = (dayIndex: number, taskId: string) => {
    setWeeklyPlan(prev => prev.map(day => {
      if (day.dayIndex === dayIndex) {
        return {
          ...day,
          tasks: day.tasks.filter(task => task.id !== taskId),
        };
      }
      return day;
    }));
  };

  const toggleTaskComplete = async (dayIndex: number, taskId: string) => {
    const day = weeklyPlan.find(d => d.dayIndex === dayIndex);
    const task = day?.tasks.find(t => t.id === taskId);
    if (!task || !profile) return;

    const newCompleted = !task.completed;
    updateTask(dayIndex, taskId, 'completed', newCompleted);

    // Update profile study time when task is completed
    if (newCompleted && task.studyMinutes > 0) {
      try {
        await supabase
          .from('profiles')
          .update({
            total_study_minutes: (profile.total_study_minutes || 0) + task.studyMinutes,
            total_tests: (profile.total_tests || 0) + task.testCount,
          })
          .eq('user_id', user?.id);
        
        refreshProfile();
      } catch (error) {
        if (import.meta.env.DEV) console.error('[Debug]', error);
      }
    }
  };

  const saveWeeklyPlan = async () => {
    if (!user) return;
    setSaving(true);

    try {
      for (const day of weeklyPlan) {
        await supabase
          .from('weekly_plans')
          .update({ sessions: day.tasks as any })
          .eq('id', day.id);
      }
      toast.success('برنامه هفتگی ذخیره شد');
    } catch (error) {
      toast.error('خطا در ذخیره برنامه');
    } finally {
      setSaving(false);
    }
  };

  const getTodayIndex = () => {
    const day = new Date().getDay();
    // Convert Sunday=0 to Saturday=0 for Persian calendar
    return day === 6 ? 0 : day + 1;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">برنامه هفتگی</h1>
            <p className="text-muted-foreground text-sm">برنامه‌ریزی مطالعه و آزمون</p>
          </div>
          <Button onClick={saveWeeklyPlan} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weeklyPlan.map(day => {
            const isToday = day.dayIndex === getTodayIndex();
            const totalMinutes = day.tasks.reduce((sum, t) => sum + (t.completed ? t.studyMinutes : 0), 0);
            const totalTests = day.tasks.reduce((sum, t) => sum + (t.completed ? t.testCount : 0), 0);

            return (
              <GlassCard 
                key={day.id} 
                className={`p-4 ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${isToday ? 'text-primary' : ''}`}>
                    {day.dayName}
                    {isToday && <span className="text-xs mr-2">(امروز)</span>}
                  </h3>
                  <Button size="sm" variant="ghost" onClick={() => addTask(day.dayIndex)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(totalMinutes / 60)}:{(totalMinutes % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{totalTests} آزمون</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {day.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      بدون برنامه
                    </p>
                  ) : (
                    day.tasks.map(task => (
                      <div 
                        key={task.id}
                        className={`p-2 rounded-lg bg-white/5 space-y-2 ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskComplete(day.dayIndex, task.id)}
                          />
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(day.dayIndex, task.id, 'title', e.target.value)}
                            placeholder="عنوان تسک"
                            className={`flex-1 h-8 text-sm bg-transparent border-0 p-0 ${
                              task.completed ? 'line-through' : ''
                            }`}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => removeTask(day.dayIndex, task.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1 flex-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <Input
                              type="number"
                              value={task.studyMinutes || ''}
                              onChange={(e) => updateTask(day.dayIndex, task.id, 'studyMinutes', parseInt(e.target.value) || 0)}
                              placeholder="دقیقه"
                              className="h-7 text-xs bg-white/5"
                              dir="ltr"
                            />
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <Input
                              type="number"
                              value={task.testCount || ''}
                              onChange={(e) => updateTask(day.dayIndex, task.id, 'testCount', parseInt(e.target.value) || 0)}
                              placeholder="آزمون"
                              className="h-7 text-xs bg-white/5"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default WeeklyProgram;