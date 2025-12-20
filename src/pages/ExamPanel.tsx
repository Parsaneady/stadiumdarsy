import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  RotateCcw,
  Upload,
  FileUp
} from 'lucide-react';

interface Lesson {
  id: string;
  name: string;
  questionCount: number;
  timeMinutes: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  percentage?: number;
  completed?: boolean;
  locked?: boolean;
}

interface ExamResult {
  id: string;
  lessonName: string;
  correct: number;
  total: number;
  percentage: number;
  createdAt: string;
  examType: string;
}

const ExamPanel = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('simple');
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // Simple exam state - with PDF upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [examTimeRemaining, setExamTimeRemaining] = useState(0);
  const [isExamTimerRunning, setIsExamTimerRunning] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [answers, setAnswers] = useState<{ correct: number; wrong: number; blank: number }>({
    correct: 0,
    wrong: 0,
    blank: 0,
  });
  
  // Simulator state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [simulatorStarted, setSimulatorStarted] = useState(false);
  const [simulatorCompleted, setSimulatorCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  // Simple exam timer
  useEffect(() => {
    if (isExamTimerRunning && examTimeRemaining > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeRemaining(prev => {
          if (prev <= 1) {
            handleExamTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [isExamTimerRunning]);

  // Simulator timer
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
        examType: r.exam_type,
      })));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      toast.success(`فایل "${file.name}" آپلود شد`);
    } else {
      toast.error('لطفاً فایل PDF انتخاب کنید');
    }
  };

  const startExam = () => {
    if (!questionCount || !timeMinutes) {
      toast.error('تعداد سوال و زمان را وارد کنید');
      return;
    }
    setExamStarted(true);
    setExamTimeRemaining(parseInt(timeMinutes) * 60);
    setIsExamTimerRunning(true);
  };

  const handleExamTimeEnd = () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    setIsExamTimerRunning(false);
    setShowAnswerSheet(true);
    toast.info('زمان آزمون تمام شد! پاسخنامه را وارد کنید');
  };

  const submitSimpleExam = async () => {
    const total = parseInt(questionCount);
    const { correct, wrong, blank } = answers;
    
    if (correct + wrong + blank !== total) {
      toast.error(`مجموع باید ${total} باشد (الان: ${correct + wrong + blank})`);
      return;
    }

    const percentage = ((correct / total) * 100).toFixed(2);

    try {
      await supabase.from('exam_results').insert({
        user_id: user?.id as string,
        exam_type: 'simple',
        lesson_name: pdfFile?.name || 'آزمون',
        correct_answers: correct,
        wrong_answers: wrong,
        blank_answers: blank,
        total_questions: total,
        percentage: parseFloat(percentage),
      } as any);

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_tests: (profile.total_tests || 0) + 1 })
          .eq('user_id', user?.id);
        refreshProfile();
      }

      toast.success(`درصد شما: ${percentage}%`);
      resetSimpleExam();
      fetchResults();
    } catch (error) {
      toast.error('خطا در ثبت نتیجه');
    }
  };

  const resetSimpleExam = () => {
    setPdfFile(null);
    setQuestionCount('');
    setTimeMinutes('');
    setExamStarted(false);
    setExamTimeRemaining(0);
    setIsExamTimerRunning(false);
    setShowAnswerSheet(false);
    setAnswers({ correct: 0, wrong: 0, blank: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addLesson = () => {
    setLessons([...lessons, {
      id: crypto.randomUUID(),
      name: '',
      questionCount: 0,
      timeMinutes: 45,
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
    
    // Lock current lesson and mark as completed
    if (currentLessonIndex !== null) {
      setLessons(prev => prev.map((l, i) => 
        i === currentLessonIndex ? { ...l, completed: true, locked: true } : l
      ));
    }

    toast.info('زمان این درس تمام شد! درس قفل شد.');
    
    // Auto advance to next
    const nextIndex = (currentLessonIndex ?? 0) + 1;
    if (nextIndex < lessons.length) {
      setTimeout(() => {
        setCurrentLessonIndex(nextIndex);
        setTimeRemaining(lessons[nextIndex].timeMinutes * 60);
        setIsTimerRunning(true);
      }, 1000);
    } else {
      setSimulatorCompleted(true);
    }
  };

  const nextLesson = () => {
    if (currentLessonIndex === null) return;
    
    // Mark current as completed and locked
    setLessons(prev => prev.map((l, i) => 
      i === currentLessonIndex ? { ...l, completed: true, locked: true } : l
    ));

    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < lessons.length) {
      setCurrentLessonIndex(nextIndex);
      setTimeRemaining(lessons[nextIndex].timeMinutes * 60);
      setIsTimerRunning(true);
    } else {
      setSimulatorCompleted(true);
      setIsTimerRunning(false);
    }
  };

  const submitSimulator = async () => {
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
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">پنل آزمون</h1>
            <p className="text-muted-foreground text-xs">آپلود فایل، زمان‌بندی و پاسخنامه</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="simple">آزمون معمولی</TabsTrigger>
            <TabsTrigger value="simulator">شبیه‌ساز</TabsTrigger>
          </TabsList>

          {/* Simple Exam with PDF Upload */}
          <TabsContent value="simple">
            <GlassCard>
              {!examStarted ? (
                <div className="space-y-4">
                  {/* PDF Upload */}
                  <div>
                    <Label className="mb-2 block">آپلود فایل آزمون (PDF)</Label>
                    <div 
                      className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {pdfFile ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <FileUp className="w-5 h-5" />
                          <span>{pdfFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p>کلیک کنید یا فایل را بکشید</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>تعداد سوالات</Label>
                      <Input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        placeholder="مثلاً 30"
                        className="bg-white/5 mt-1"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label>زمان (دقیقه)</Label>
                      <Input
                        type="number"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(e.target.value)}
                        placeholder="مثلاً 45"
                        className="bg-white/5 mt-1"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button onClick={startExam} className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    شروع آزمون
                  </Button>
                </div>
              ) : !showAnswerSheet ? (
                <div className="space-y-4 text-center">
                  {/* Timer Display */}
                  <div className={`text-5xl font-bold ${examTimeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                    {formatTime(examTimeRemaining)}
                  </div>
                  <p className="text-muted-foreground">
                    {pdfFile?.name || 'آزمون'} - {questionCount} سوال
                  </p>
                  
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setIsExamTimerRunning(!isExamTimerRunning)}
                    >
                      {isExamTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsExamTimerRunning(false);
                        setShowAnswerSheet(true);
                      }}
                    >
                      اتمام و ورود پاسخنامه
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-center">پاسخنامه</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    مجموع باید {questionCount} شود
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center gap-1 text-success">
                        <CheckCircle className="w-4 h-4" /> صحیح
                      </Label>
                      <Input
                        type="number"
                        value={answers.correct || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, correct: parseInt(e.target.value) || 0 }))}
                        className="bg-white/5 mt-1"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-destructive">
                        <XCircle className="w-4 h-4" /> غلط
                      </Label>
                      <Input
                        type="number"
                        value={answers.wrong || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, wrong: parseInt(e.target.value) || 0 }))}
                        className="bg-white/5 mt-1"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-muted-foreground">
                        <Minus className="w-4 h-4" /> نزده
                      </Label>
                      <Input
                        type="number"
                        value={answers.blank || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, blank: parseInt(e.target.value) || 0 }))}
                        className="bg-white/5 mt-1"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="text-center py-3 bg-primary/10 rounded-lg">
                    <span className="text-lg font-bold text-primary">
                      درصد: {questionCount ? ((answers.correct / parseInt(questionCount)) * 100).toFixed(1) : 0}%
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {answers.correct + answers.wrong + answers.blank}/{questionCount}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={resetSimpleExam} variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 ml-1" />
                      شروع مجدد
                    </Button>
                    <Button onClick={submitSimpleExam} className="flex-1">
                      ثبت نتیجه
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Simulator - with timed locked answer sheets */}
          <TabsContent value="simulator">
            {!simulatorStarted ? (
              <GlassCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">دروس (با قفل زمانی)</h3>
                    <Button size="sm" onClick={addLesson} className="gap-1 text-xs">
                      <Plus className="w-3 h-3" />
                      افزودن
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    پس از اتمام زمان هر درس، پاسخنامه آن قفل می‌شود
                  </p>

                  {lessons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      دروس آزمون را اضافه کنید
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm">
                          <span className="text-muted-foreground w-5">{index + 1}</span>
                          <Input
                            value={lesson.name}
                            onChange={(e) => updateLesson(lesson.id, 'name', e.target.value)}
                            placeholder="نام درس"
                            className="flex-1 bg-white/5 h-8 text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={lesson.timeMinutes}
                              onChange={(e) => updateLesson(lesson.id, 'timeMinutes', parseInt(e.target.value) || 0)}
                              className="w-14 bg-white/5 h-8 text-sm"
                              dir="ltr"
                            />
                            <span className="text-xs text-muted-foreground">د</span>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeLesson(lesson.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
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
              <div className="space-y-3">
                {/* Timer */}
                <GlassCard className="text-center py-4">
                  <div className={`text-4xl font-bold ${timeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    {lessons[currentLessonIndex!]?.name}
                  </p>
                  <div className="flex justify-center gap-2 mt-3">
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">{lessons[currentLessonIndex!]?.name}</h3>
                    {lessons[currentLessonIndex!]?.locked && (
                      <Badge variant="destructive" className="text-xs">قفل شده</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="flex items-center gap-1 text-success text-xs">
                        <CheckCircle className="w-3 h-3" /> صحیح
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.correct || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'correct', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1 h-9"
                        disabled={lessons[currentLessonIndex!]?.locked}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-destructive text-xs">
                        <XCircle className="w-3 h-3" /> غلط
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.wrong || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'wrong', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1 h-9"
                        disabled={lessons[currentLessonIndex!]?.locked}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Minus className="w-3 h-3" /> نزده
                      </Label>
                      <Input
                        type="number"
                        value={lessons[currentLessonIndex!]?.blank || ''}
                        onChange={(e) => updateLesson(lessons[currentLessonIndex!].id, 'blank', parseInt(e.target.value) || 0)}
                        className="bg-white/5 mt-1 h-9"
                        disabled={lessons[currentLessonIndex!]?.locked}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button onClick={nextLesson} className="w-full mt-3" size="sm">
                    {currentLessonIndex! < lessons.length - 1 ? 'درس بعدی' : 'پایان آزمون'}
                  </Button>
                </GlassCard>

                {/* Progress */}
                <GlassCard className="py-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">پیشرفت</span>
                    <span>{(currentLessonIndex || 0) + 1} از {lessons.length}</span>
                  </div>
                  <Progress value={(((currentLessonIndex || 0) + 1) / lessons.length) * 100} className="h-2" />
                </GlassCard>
              </div>
            ) : (
              <GlassCard>
                <h3 className="font-semibold text-center mb-4">نتایج شبیه‌ساز</h3>
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const total = (lesson.correct || 0) + (lesson.wrong || 0) + (lesson.blank || 0);
                    const pct = total > 0 ? ((lesson.correct || 0) / total * 100).toFixed(1) : '0';
                    return (
                      <div key={lesson.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                        <span>{idx + 1}. {lesson.name}</span>
                        <Badge variant={Number(pct) >= 60 ? 'default' : 'destructive'}>
                          {pct}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={resetSimulator} variant="outline" className="flex-1" size="sm">
                    <RotateCcw className="w-4 h-4 ml-1" />
                    شروع مجدد
                  </Button>
                  <Button onClick={submitSimulator} className="flex-1" size="sm">
                    ثبت نتایج
                  </Button>
                </div>
              </GlassCard>
            )}
          </TabsContent>
        </Tabs>

        {/* Results History */}
        {results.length > 0 && (
          <GlassCard>
            <h3 className="font-semibold mb-3 text-sm">تاریخچه آزمون‌ها</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {results.map(result => (
                <div key={result.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-xs">{result.lessonName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${result.percentage >= 60 ? 'text-success' : 'text-destructive'}`}>
                      {result.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{result.correct}/{result.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </AppLayout>
  );
};

export default ExamPanel;
