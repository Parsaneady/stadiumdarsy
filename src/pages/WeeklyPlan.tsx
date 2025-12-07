import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw } from 'lucide-react';
import { useStudyStore } from '@/stores/studyStore';
import { DayCard } from '@/components/DayCard';
import { Button } from '@/components/ui/button';

const WeeklyPlan = () => {
  const { weeklyPlan, initializeWeek } = useStudyStore();

  useEffect(() => {
    if (weeklyPlan.length === 0) {
      initializeWeek();
    }
  }, [weeklyPlan.length, initializeWeek]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">برنامه هفتگی</h1>
            <p className="text-muted-foreground mt-1">
              جلسات مطالعه خود را برنامه‌ریزی کنید
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={initializeWeek}
          className="glass-button"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          بازنشانی هفته
        </Button>
      </motion.div>

      {/* Week Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 flex items-center justify-around"
      >
        {[
          { 
            label: 'کل جلسات', 
            value: weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0) 
          },
          { 
            label: 'تکمیل شده', 
            value: weeklyPlan.reduce((sum, day) => sum + day.sessions.filter(s => s.completed).length, 0) 
          },
          { 
            label: 'ساعت هدف', 
            value: `${weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetHours, 0), 0).toFixed(1)}` 
          },
          { 
            label: 'تست هدف', 
            value: weeklyPlan.reduce((sum, day) => sum + day.sessions.reduce((s, sess) => s + sess.targetTests, 0), 0) 
          },
        ].map((stat, index) => (
          <div key={stat.label} className="text-center">
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
              className="text-2xl font-bold text-primary"
            >
              {stat.value}
            </motion.p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Days */}
      <div className="space-y-4">
        {weeklyPlan.map((day, index) => (
          <DayCard key={day.id} day={day} delay={0.2 + index * 0.05} />
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlan;
