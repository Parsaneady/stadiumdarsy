import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  RotateCcw
} from 'lucide-react';

interface Lesson {
  id: string;
  name: string;
  questionRange: string;
  timeMinutes: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  percentage?: number;
  completed?: boolean;
}

interface ExamResult {
  id: string;
  lessonName: string;
  correct: number;
  total: number;
  percentage: number;
  createdAt: string;
}

const ExamPanel = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('simple');
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // Simple exam state
  const [lessonName, setLessonName] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  
  // Simulator state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [simulatorStarted, setSimulatorStarted] = useState(false);
  const [simulatorCompleted, setSimulatorCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const fetchResults = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setResults(data.map(r => ({
        id: r.id,
        lessonName: r.lesson_name || 'شبیه‌ساز',
        correct: r.correct_answers,
        total: r.total_questions,
        percentage: Number(r.percentage),
        createdAt: r.created_at,
      })));
    }
  };

  const handleSimpleSubmit = async () => {
    if (!lessonName || !correctAnswers || !totalQuestions) {
      toast.error('همه فیلدها را پر کنید');
      return;
    }

    const correct = parseInt(correctAnswers);
    const total = parseInt(totalQuestions);
    
    if (correct > total) {
      toast.error('پاسخ صحیح نمی‌تواند بیشتر از کل سوالات باشد');
      return;
    }

    const percentage = ((correct / total) * 100).toFixed(2);

    try {
      await supabase.from('exam_results').insert({
        user_id: user?.id as string,
        exam_type: 'simple',
        lesson_name: lessonName,
        correct_answers: correct,
        total_questions: total,
        percentage: parseFloat(percentage),
      } as any);

      // Update profile test count
      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_tests: (profile.total_tests || 0) + 1 })
          .eq('user_id', user?.id);
        refreshProfile();
      }

      toast.success(`درصد شما: ${percentage}%`);
      setLessonName('');
      setCorrectAnswers('');
      setTotalQuestions('');
      fetchResults();
    } catch (error) {
      toast.error('خطا در ثبت نتیجه');
    }
  };

  const addLesson = () => {
    setLessons([...lessons, {
      id: crypto.randomUUID(),
      name: '',
      questionRange: '',
      timeMinutes: 10,
    }]);
  };

  const updateLesson = (id: string, field: keyof Lesson, value: any) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const startSimulator = () => {
    if (lessons.length === 0) {
      toast.error('حداقل یک درس اضافه کنید');
      return;
    }
    if (lessons.some(l => !l.name || !l.timeMinutes)) {
      toast.error('همه فیلدها را پر کنید');
      return;
    }

    setSimulatorStarted(true);
    setCurrentLessonIndex(0);
    setTimeRemaining(lessons[0].timeMinutes * 60);
    setIsTimerRunning(true);
  };

  const handleTimerEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    
    // Mark current lesson as completed
    if (currentLessonIndex !== null) {
      setLessons(prev => prev.map((l, i) => 
        i === currentLessonIndex ? { ...l, completed: true } : l
      ));
    }

    toast.info('زمان این درس تمام شد');
  };

  const nextLesson = () => {
    if (currentLessonIndex === null) return;
    
    // Mark current as completed
    setLessons(prev => prev.map((l, i) => 
      i === currentLessonIndex ? { ...l, completed: true } : l
    ));

    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < lessons.length) {
      setCurrentLessonIndex(nextIndex);
      setTimeRemaining(lessons[nextIndex].timeMinutes * 60);
      setIsTimerRunning(true);
    } else {
      // All lessons completed
      setSimulatorCompleted(true);
      setIsTimerRunning(false);
    }
  };

  const submitSimulator = async () => {
    // Calculate percentages for each lesson
    const updatedLessons = lessons.map(l => {
      const total = (l.correct || 0) + (l.wrong || 0) + (l.blank || 0);
      const percentage = total > 0 ? ((l.correct || 0) / total) * 100 : 0;
      return { ...l, percentage, totalQuestions: total };
    });

    const avgPercentage = updatedLessons.reduce((sum, l) => sum + (l.percentage || 0), 0) / updatedLessons.length;

    try {
      await supabase.from('exam_results').insert({
        user_id: user?.id as string,
        exam_type: 'simulator',
        lesson_name: 'شبیه‌ساز آزمون',
        correct_answers: updatedLessons.reduce((sum, l) => sum + (l.correct || 0), 0),
        wrong_answers: updatedLessons.reduce((sum, l) => sum + (l.wrong || 0), 0),
        blank_answers: updatedLessons.reduce((sum, l) => sum + (l.blank || 0), 0),
        total_questions: updatedLessons.reduce((sum, l) => sum + ((l.correct || 0) + (l.wrong || 0) + (l.blank || 0)), 0),
        percentage: parseFloat(avgPercentage.toFixed(2)),
        average_percentage: parseFloat(avgPercentage.toFixed(2)),
        lessons_data: updatedLessons as any,
      } as any);

      // Update profile test count
      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_tests: (profile.total_tests || 0) + 1 })
          .eq('user_id', user?.id);
        refreshProfile();
      }

      toast.success(`میانگین درصد: ${avgPercentage.toFixed(2)}%`);
      resetSimulator();
      fetchResults();
    } catch (error) {
      toast.error('خطا در ثبت نتیجه');
    }
  };

  const resetSimulator = () => {
    setLessons([]);
    setCurrentLessonIndex(null);
    setTimeRemaining(0);
    setIsTimerRunning(false);
    setSimulatorStarted(false);
    setSimulatorCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">پنل آزمون</h1>
            <p className="text-muted-foreground text-sm">ثبت و تحلیل نتایج آزمون</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="simple">آزمون ساده</TabsTrigger>
            <TabsTrigger value="simulator">شبیه‌ساز آزمون</TabsTrigger>
          </TabsList>

          {/* Simple Exam */}
          <TabsContent value="simple">
            <GlassCard>
              <div className="space-y-4">
                <div>
                  <Label>نام درس</Label>
                  <Input
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="مثلاً: ریاضی"
                    className="bg-white/5 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>پاسخ‌های صحیح</Label>
                    <Input
                      type="number"
                      value={correctAnswers}
                      onChange={(e) => setCorrectAnswers(e.target.value)}
                      placeholder="0"
                      className="bg-white/5 mt-1"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label>تعداد کل سوالات</Label>
                    <Input
                      type="number"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(e.target.value)}
                      placeholder="0"
                      className="bg-white/5 mt-1"
                      dir="ltr"
                    />
                  </div>
                </div>
                {correctAnswers && totalQuestions && (
                  <div className="text-center py-3 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-primary">
                      درصد: {((parseInt(correctAnswers) / parseInt(totalQuestions)) * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
                <Button onClick={handleSimpleSubmit} className="w-full">
                  ثبت نتیجه
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Simulator */}
          <TabsContent value="simulator">
            {!simulatorStarted ? (
              <GlassCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">دروس آزمون</h3>
                    <Button size="sm" onClick={addLesson} className="gap-1">
                      <Plus className="w-4 h-4" />
                      افزودن درس
                    </Button>
                  </div>

                  {lessons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      برای شروع، دروس آزمون را اضافه کنید
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <span className="text-muted-foreground">{index + 1}</span>
                          <Input
                            value={lesson.name}
                            onChange={(e) => updateLesson(lesson.id, 'name', e.target.value)}
                            placeholder="نام درس"
                            className="flex-1 bg-white/5"
                          />
                          <Input
                            value={lesson.questionRange}
                            onChange={(e) => updateLesson(lesson.id, 'questionRange', e.target.value)}
                            placeholder="بازه سوالات"
                            className="w-24 bg-white/5"
                            dir="ltr"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={lesson.timeMinutes}
                              onChange={(e) => updateLesson(lesson.id, 'timeMinutes', parseInt(e.target.value) || 0)}
                              className="w-16 bg-white/5"
                              dir="ltr"
                            />
                            <span className="text-sm text-muted-foreground">دقیقه</span>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeLesson(lesson.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <Button onClick={startSimulator} className="w-full gap-2">
                      <Play className="w-4 h-4" />
                      شروع شبیه‌ساز
                    </Button>
                  )}
                </div>
              </GlassCard>
            ) : !simulatorCompleted ? (
              <div className="space-y-4">
                {/* Timer */}
                <GlassCard className="text-center">
                  <div className={`text-4xl font-bold ${timeRemaining < 60 ? 'text-destructive' : 'text-primary'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    درس: {lessons[currentLessonIndex!]?.name}
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </GlassCard>

                {/* Current Lesson Input */}
                <GlassCard>
                  <h3 className="font-medium mb-4">{lessons[currentLessonIndex!]?.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-4 h-4" /> صحیح
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.correct || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'correct', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1"
                        disabled={lessons[currentLessonIndex!]?.completed}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-destructive">
                        <XCircle className="w-4 h-4" /> غلط
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.wrong || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'wrong', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1"
                        disabled={lessons[currentLessonIndex!]?.completed}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="w-4 h-4" /> نزده
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.blank || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'blank', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1"
                        disabled={lessons[currentLessonIndex!]?.completed}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button onClick={nextLesson} className="w-full mt-4">
                    {currentLessonIndex! < lessons.length - 1 ? 'درس بعدی' : 'پایان آزمون'}
                  </Button>
                </GlassCard>

                {/* Progress */}
                <div className="flex gap-2">
                  {lessons.map((l, i) => (
                    <Badge 
                      key={l.id}
                      variant={i === currentLessonIndex ? 'default' : l.completed ? 'secondary' : 'outline'}
                    >
                      {l.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <GlassCard>
                <h3 className="font-medium mb-4 text-center">نتایج شبیه‌ساز</h3>
                <div className="space-y-3">
                  {lessons.map(l => {
                    const total = (l.correct || 0) + (l.wrong || 0) + (l.blank || 0);
                    const pct = total > 0 ? ((l.correct || 0) / total) * 100 : 0;
                    return (
                      <div key={l.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>{l.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-500">{l.correct || 0} صحیح</span>
                          <span className="text-destructive">{l.wrong || 0} غلط</span>
                          <span className="text-muted-foreground">{l.blank || 0} نزده</span>
                          <Badge variant="secondary">{pct.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={submitSimulator} className="flex-1">
                    ثبت نتایج
                  </Button>
                  <Button variant="outline" onClick={resetSimulator} className="gap-1">
                    <RotateCcw className="w-4 h-4" />
                    شروع مجدد
                  </Button>
                </div>
              </GlassCard>
            )}
          </TabsContent>
        </Tabs>

        {/* Results History */}
        <GlassCard>
          <h3 className="font-medium mb-4">تاریخچه آزمون‌ها</h3>
          {results.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              هنوز آزمونی ثبت نشده
            </p>
          ) : (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">{r.lessonName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {r.correct} / {r.total}
                    </span>
                    <Badge className={r.percentage >= 60 ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}>
                      {r.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
};

export default ExamPanel;