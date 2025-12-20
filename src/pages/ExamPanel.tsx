import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PdfViewer } from '@/components/exam/PdfViewer';
import { AnswerSheet } from '@/components/exam/AnswerSheet';
import { CorrectAnswerSheet } from '@/components/exam/CorrectAnswerSheet';
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
  Upload,
  FileUp,
  RotateCcw,
  Eye,
  Edit3,
  Save,
  Lock
} from 'lucide-react';

interface SimulatorLesson {
  id: string;
  name: string;
  questionStart: number;
  questionEnd: number;
  timeMinutes: number;
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

type ExamPhase = 'setup' | 'answering' | 'correcting' | 'results';
type ViewMode = 'pdf' | 'answers';

const ExamPanel = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('simple');
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // Simple exam state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [examPhase, setExamPhase] = useState<ExamPhase>('setup');
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Simulator state
  const [simLessons, setSimLessons] = useState<SimulatorLesson[]>([]);
  const [simCurrentLessonIndex, setSimCurrentLessonIndex] = useState(0);
  const [simPhase, setSimPhase] = useState<ExamPhase>('setup');
  const [simAnswers, setSimAnswers] = useState<Record<number, number>>({});
  const [simCorrectAnswers, setSimCorrectAnswers] = useState<Record<number, number>>({});
  const [simLockedQuestions, setSimLockedQuestions] = useState<Set<number>>(new Set());
  const [simTimeRemaining, setSimTimeRemaining] = useState(0);
  const [simIsTimerRunning, setSimIsTimerRunning] = useState(false);
  const [simPdfFile, setSimPdfFile] = useState<File | null>(null);
  const [simTotalQuestions, setSimTotalQuestions] = useState('');
  const [simViewMode, setSimViewMode] = useState<ViewMode>('pdf');
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

  // Simple exam timer
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast.info('زمان تمام شد!');
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

  // Simulator timer
  useEffect(() => {
    if (simIsTimerRunning && simTimeRemaining > 0) {
      simTimerRef.current = setInterval(() => {
        setSimTimeRemaining(prev => {
          if (prev <= 1) {
            handleSimLessonTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [simIsTimerRunning]);

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
        lessonName: r.lesson_name || 'تست',
        correct: r.correct_answers,
        total: r.total_questions,
        percentage: Number(r.percentage),
        createdAt: r.created_at,
        examType: r.exam_type,
      })));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========== SIMPLE EXAM ==========
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
    if (!questionCount) {
      toast.error('تعداد سوال را وارد کنید');
      return;
    }
    setExamPhase('answering');
    setAnswers({});
    setCorrectAnswers({});
    if (timeMinutes) {
      setTimeRemaining(parseInt(timeMinutes) * 60);
      setIsTimerRunning(true);
    }
  };

  const handleAnswerSelect = useCallback((qIndex: number, option: number) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  }, []);

  const handleCorrectAnswerSelect = useCallback((qIndex: number, option: number) => {
    setCorrectAnswers(prev => ({ ...prev, [qIndex]: option }));
  }, []);

  const finishAnswering = () => {
    setIsTimerRunning(false);
    setExamPhase('correcting');
    setViewMode('answers');
  };

  const calculateResults = () => {
    const total = parseInt(questionCount);
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (let i = 0; i < total; i++) {
      if (!answers[i]) {
        blank++;
      } else if (answers[i] === correctAnswers[i]) {
        correct++;
      } else {
        wrong++;
      }
    }

    return { correct, wrong, blank, total, percentage: (correct / total) * 100 };
  };

  const submitExam = async () => {
    const result = calculateResults();
    
    try {
      await supabase.from('exam_results').insert({
        user_id: user?.id,
        exam_type: 'simple',
        lesson_name: pdfFile?.name || 'تست',
        correct_answers: result.correct,
        wrong_answers: result.wrong,
        blank_answers: result.blank,
        total_questions: result.total,
        percentage: result.percentage,
      } as any);

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_tests: (profile.total_tests || 0) + 1 })
          .eq('user_id', user?.id);
        refreshProfile();
      }

      setExamPhase('results');
      fetchResults();
      toast.success(`درصد شما: ${result.percentage.toFixed(1)}%`);
    } catch (error) {
      toast.error('خطا در ثبت نتیجه');
    }
  };

  const resetExam = () => {
    setPdfFile(null);
    setQuestionCount('');
    setTimeMinutes('');
    setExamPhase('setup');
    setViewMode('pdf');
    setAnswers({});
    setCorrectAnswers({});
    setTimeRemaining(0);
    setIsTimerRunning(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== SIMULATOR ==========
  const handleSimFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSimPdfFile(file);
      toast.success(`فایل "${file.name}" آپلود شد`);
    } else {
      toast.error('لطفاً فایل PDF انتخاب کنید');
    }
  };

  const addSimLesson = () => {
    const lastEnd = simLessons.length > 0 
      ? simLessons[simLessons.length - 1].questionEnd 
      : 0;
    
    setSimLessons([...simLessons, {
      id: crypto.randomUUID(),
      name: '',
      questionStart: lastEnd + 1,
      questionEnd: lastEnd + 10,
      timeMinutes: 45,
    }]);
  };

  const updateSimLesson = (id: string, field: keyof SimulatorLesson, value: any) => {
    setSimLessons(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeSimLesson = (id: string) => {
    setSimLessons(prev => prev.filter(l => l.id !== id));
  };

  const startSimulator = () => {
    if (simLessons.length === 0) {
      toast.error('حداقل یک درس اضافه کنید');
      return;
    }
    if (simLessons.some(l => !l.name)) {
      toast.error('نام درس‌ها را وارد کنید');
      return;
    }

    const total = simLessons[simLessons.length - 1].questionEnd;
    setSimTotalQuestions(total.toString());
    setSimPhase('answering');
    setSimCurrentLessonIndex(0);
    setSimTimeRemaining(simLessons[0].timeMinutes * 60);
    setSimIsTimerRunning(true);
    setSimAnswers({});
    setSimCorrectAnswers({});
    setSimLockedQuestions(new Set());
  };

  const handleSimLessonTimeEnd = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setSimIsTimerRunning(false);

    // Lock questions for current lesson
    const currentLesson = simLessons[simCurrentLessonIndex];
    const newLocked = new Set(simLockedQuestions);
    for (let i = currentLesson.questionStart - 1; i < currentLesson.questionEnd; i++) {
      newLocked.add(i);
    }
    setSimLockedQuestions(newLocked);
    
    toast.info(`زمان ${currentLesson.name} تمام شد! سوالات ${currentLesson.questionStart} تا ${currentLesson.questionEnd} قفل شدند.`);

    // Move to next lesson or finish
    if (simCurrentLessonIndex < simLessons.length - 1) {
      const nextIndex = simCurrentLessonIndex + 1;
      setSimCurrentLessonIndex(nextIndex);
      setSimTimeRemaining(simLessons[nextIndex].timeMinutes * 60);
      setSimIsTimerRunning(true);
    }
  };

  const handleSimAnswerSelect = useCallback((qIndex: number, option: number) => {
    if (simLockedQuestions.has(qIndex)) return;
    setSimAnswers(prev => ({ ...prev, [qIndex]: option }));
  }, [simLockedQuestions]);

  const handleSimCorrectAnswerSelect = useCallback((qIndex: number, option: number) => {
    setSimCorrectAnswers(prev => ({ ...prev, [qIndex]: option }));
  }, []);

  const finishSimulator = () => {
    setSimIsTimerRunning(false);
    setSimPhase('correcting');
    setSimViewMode('answers');
  };

  const calculateSimResults = () => {
    const total = parseInt(simTotalQuestions);
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (let i = 0; i < total; i++) {
      if (!simAnswers[i]) {
        blank++;
      } else if (simAnswers[i] === simCorrectAnswers[i]) {
        correct++;
      } else {
        wrong++;
      }
    }

    return { correct, wrong, blank, total, percentage: (correct / total) * 100 };
  };

  const submitSimulator = async () => {
    const result = calculateSimResults();
    
    try {
      await supabase.from('exam_results').insert({
        user_id: user?.id,
        exam_type: 'simulator',
        lesson_name: 'شبیه‌ساز',
        correct_answers: result.correct,
        wrong_answers: result.wrong,
        blank_answers: result.blank,
        total_questions: result.total,
        percentage: result.percentage,
        lessons_data: simLessons as any,
      } as any);

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_tests: (profile.total_tests || 0) + 1 })
          .eq('user_id', user?.id);
        refreshProfile();
      }

      setSimPhase('results');
      fetchResults();
      toast.success(`درصد شما: ${result.percentage.toFixed(1)}%`);
    } catch (error) {
      toast.error('خطا در ثبت نتیجه');
    }
  };

  const resetSimulator = () => {
    setSimPdfFile(null);
    setSimLessons([]);
    setSimPhase('setup');
    setSimViewMode('pdf');
    setSimAnswers({});
    setSimCorrectAnswers({});
    setSimLockedQuestions(new Set());
    setSimTimeRemaining(0);
    setSimIsTimerRunning(false);
    setSimCurrentLessonIndex(0);
    setSimTotalQuestions('');
    if (simFileInputRef.current) simFileInputRef.current.value = '';
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">پنل تست</h1>
            <p className="text-muted-foreground text-xs">PDF + پاسخبرگ + تصحیح</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="simple">تست معمولی</TabsTrigger>
            <TabsTrigger value="simulator">شبیه‌ساز</TabsTrigger>
          </TabsList>

          {/* ========== SIMPLE EXAM ========== */}
          <TabsContent value="simple" className="space-y-4">
            {examPhase === 'setup' && (
              <GlassCard>
                <div className="space-y-4">
                  {/* PDF Upload */}
                  <div>
                    <Label className="mb-2 block text-sm">آپلود PDF (اختیاری)</Label>
                    <div 
                      className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
                          <FileUp className="w-4 h-4" />
                          <span className="text-sm">{pdfFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs">کلیک کنید</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">تعداد سوال</Label>
                      <Input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        placeholder="30"
                        className="bg-white/5 mt-1 h-9"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">زمان (دقیقه - اختیاری)</Label>
                      <Input
                        type="number"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(e.target.value)}
                        placeholder="45"
                        className="bg-white/5 mt-1 h-9"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button onClick={startExam} className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    شروع تست
                  </Button>
                </div>
              </GlassCard>
            )}

            {(examPhase === 'answering' || examPhase === 'correcting') && (
              <div className="space-y-3">
                {/* Timer & Controls */}
                <div className="flex items-center justify-between glass-card rounded-lg p-3">
                  {timeMinutes && examPhase === 'answering' && (
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${timeRemaining < 60 ? 'text-destructive' : 'text-primary'}`} />
                      <span className={`font-mono font-bold ${timeRemaining < 60 ? 'text-destructive' : ''}`}>
                        {formatTime(timeRemaining)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                        {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'pdf' ? 'default' : 'outline'}
                      onClick={() => setViewMode('pdf')}
                      className="gap-1 h-7 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'answers' ? 'default' : 'outline'}
                      onClick={() => setViewMode('answers')}
                      className="gap-1 h-7 text-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      پاسخبرگ
                    </Button>
                  </div>

                  {examPhase === 'answering' && (
                    <Button size="sm" onClick={finishAnswering} className="gap-1 h-7 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      اتمام و تصحیح
                    </Button>
                  )}
                </div>

                {/* Main Content */}
                <div className="glass-card rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
                  {viewMode === 'pdf' ? (
                    <PdfViewer file={pdfFile} />
                  ) : examPhase === 'answering' ? (
                    <AnswerSheet
                      questionCount={parseInt(questionCount) || 0}
                      answers={answers}
                      onAnswerSelect={handleAnswerSelect}
                    />
                  ) : (
                    <div className="grid grid-cols-2 h-full divide-x divide-white/10">
                      <div className="overflow-auto">
                        <div className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-white/10">
                          پاسخ‌های شما
                        </div>
                        <AnswerSheet
                          questionCount={parseInt(questionCount) || 0}
                          answers={answers}
                          onAnswerSelect={() => {}}
                          correctAnswers={correctAnswers}
                          showResults={Object.keys(correctAnswers).length > 0}
                        />
                      </div>
                      <div className="overflow-auto">
                        <CorrectAnswerSheet
                          questionCount={parseInt(questionCount) || 0}
                          correctAnswers={correctAnswers}
                          onCorrectAnswerSelect={handleCorrectAnswerSelect}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit / Reset */}
                {examPhase === 'correcting' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetExam} className="flex-1 gap-1">
                      <RotateCcw className="w-4 h-4" />
                      شروع مجدد
                    </Button>
                    <Button onClick={submitExam} className="flex-1 gap-1">
                      <Save className="w-4 h-4" />
                      ثبت نتیجه
                    </Button>
                  </div>
                )}
              </div>
            )}

            {examPhase === 'results' && (
              <GlassCard>
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 mx-auto text-success" />
                  <div>
                    <h3 className="text-2xl font-bold text-success">{calculateResults().percentage.toFixed(1)}%</h3>
                    <p className="text-muted-foreground">
                      {calculateResults().correct} صحیح از {calculateResults().total}
                    </p>
                  </div>
                  <Button onClick={resetExam} className="gap-1">
                    <RotateCcw className="w-4 h-4" />
                    تست جدید
                  </Button>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* ========== SIMULATOR ========== */}
          <TabsContent value="simulator" className="space-y-4">
            {simPhase === 'setup' && (
              <GlassCard>
                <div className="space-y-4">
                  {/* PDF Upload */}
                  <div>
                    <Label className="mb-2 block text-sm">آپلود PDF (اختیاری)</Label>
                    <div 
                      className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => simFileInputRef.current?.click()}
                    >
                      <input
                        ref={simFileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleSimFileUpload}
                        className="hidden"
                      />
                      {simPdfFile ? (
                        <div className="flex items-center justify-center gap-2 text-success">
                          <FileUp className="w-4 h-4" />
                          <span className="text-sm">{simPdfFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs">کلیک کنید</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lessons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">دفترچه‌ها (با قفل زمانی)</Label>
                      <Button size="sm" onClick={addSimLesson} className="gap-1 h-7 text-xs">
                        <Plus className="w-3 h-3" />
                        افزودن
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      پس از اتمام زمان هر دفترچه، سوالات آن قفل می‌شوند
                    </p>

                    {simLessons.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        دفترچه‌ها را اضافه کنید
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {simLessons.map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg text-sm">
                            <span className="text-muted-foreground w-4">{idx + 1}</span>
                            <Input
                              value={lesson.name}
                              onChange={(e) => updateSimLesson(lesson.id, 'name', e.target.value)}
                              placeholder="نام درس"
                              className="flex-1 bg-white/5 h-8 text-sm"
                            />
                            <div className="flex items-center gap-1 text-xs">
                              <span>از</span>
                              <Input
                                type="number"
                                value={lesson.questionStart}
                                onChange={(e) => updateSimLesson(lesson.id, 'questionStart', parseInt(e.target.value) || 1)}
                                className="w-12 bg-white/5 h-7 text-xs"
                                dir="ltr"
                              />
                              <span>تا</span>
                              <Input
                                type="number"
                                value={lesson.questionEnd}
                                onChange={(e) => updateSimLesson(lesson.id, 'questionEnd', parseInt(e.target.value) || 1)}
                                className="w-12 bg-white/5 h-7 text-xs"
                                dir="ltr"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={lesson.timeMinutes}
                                onChange={(e) => updateSimLesson(lesson.id, 'timeMinutes', parseInt(e.target.value) || 0)}
                                className="w-12 bg-white/5 h-7 text-xs"
                                dir="ltr"
                              />
                              <span className="text-xs text-muted-foreground">د</span>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSimLesson(lesson.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {simLessons.length > 0 && (
                    <Button onClick={startSimulator} className="w-full gap-2">
                      <Play className="w-4 h-4" />
                      شروع شبیه‌ساز
                    </Button>
                  )}
                </div>
              </GlassCard>
            )}

            {(simPhase === 'answering' || simPhase === 'correcting') && (
              <div className="space-y-3">
                {/* Timer & Current Lesson */}
                <div className="flex items-center justify-between glass-card rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${simTimeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                      <span className={`font-mono font-bold ${simTimeRemaining < 60 ? 'text-destructive' : ''}`}>
                        {formatTime(simTimeRemaining)}
                      </span>
                      {simPhase === 'answering' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSimIsTimerRunning(!simIsTimerRunning)}>
                          {simIsTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                    {simPhase === 'answering' && (
                      <Badge variant="secondary" className="text-xs">
                        {simLessons[simCurrentLessonIndex]?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={simViewMode === 'pdf' ? 'default' : 'outline'}
                      onClick={() => setSimViewMode('pdf')}
                      className="gap-1 h-7 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant={simViewMode === 'answers' ? 'default' : 'outline'}
                      onClick={() => setSimViewMode('answers')}
                      className="gap-1 h-7 text-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      پاسخبرگ
                    </Button>
                  </div>

                  {simPhase === 'answering' && (
                    <Button size="sm" onClick={finishSimulator} className="gap-1 h-7 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      اتمام
                    </Button>
                  )}
                </div>

                {/* Locked Info */}
                {simLockedQuestions.size > 0 && simPhase === 'answering' && (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg p-2">
                    <Lock className="w-3 h-3" />
                    <span>{simLockedQuestions.size} سوال قفل شده</span>
                  </div>
                )}

                {/* Main Content */}
                <div className="glass-card rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 320px)' }}>
                  {simViewMode === 'pdf' ? (
                    <PdfViewer file={simPdfFile} />
                  ) : simPhase === 'answering' ? (
                    <AnswerSheet
                      questionCount={parseInt(simTotalQuestions) || 0}
                      answers={simAnswers}
                      onAnswerSelect={handleSimAnswerSelect}
                      lockedQuestions={simLockedQuestions}
                    />
                  ) : (
                    <div className="grid grid-cols-2 h-full divide-x divide-white/10">
                      <div className="overflow-auto">
                        <div className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-white/10">
                          پاسخ‌های شما
                        </div>
                        <AnswerSheet
                          questionCount={parseInt(simTotalQuestions) || 0}
                          answers={simAnswers}
                          onAnswerSelect={() => {}}
                          correctAnswers={simCorrectAnswers}
                          showResults={Object.keys(simCorrectAnswers).length > 0}
                          lockedQuestions={simLockedQuestions}
                        />
                      </div>
                      <div className="overflow-auto">
                        <CorrectAnswerSheet
                          questionCount={parseInt(simTotalQuestions) || 0}
                          correctAnswers={simCorrectAnswers}
                          onCorrectAnswerSelect={handleSimCorrectAnswerSelect}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit / Reset */}
                {simPhase === 'correcting' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetSimulator} className="flex-1 gap-1">
                      <RotateCcw className="w-4 h-4" />
                      شروع مجدد
                    </Button>
                    <Button onClick={submitSimulator} className="flex-1 gap-1">
                      <Save className="w-4 h-4" />
                      ثبت نتیجه
                    </Button>
                  </div>
                )}
              </div>
            )}

            {simPhase === 'results' && (
              <GlassCard>
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 mx-auto text-success" />
                  <div>
                    <h3 className="text-2xl font-bold text-success">{calculateSimResults().percentage.toFixed(1)}%</h3>
                    <p className="text-muted-foreground">
                      {calculateSimResults().correct} صحیح از {calculateSimResults().total}
                    </p>
                  </div>
                  <Button onClick={resetSimulator} className="gap-1">
                    <RotateCcw className="w-4 h-4" />
                    شبیه‌ساز جدید
                  </Button>
                </div>
              </GlassCard>
            )}
          </TabsContent>
        </Tabs>

        {/* Results History */}
        {results.length > 0 && (examPhase === 'setup' || simPhase === 'setup') && (
          <GlassCard>
            <h3 className="font-semibold mb-3 text-sm">تاریخچه</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.slice(0, 5).map(result => (
                <div key={result.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-xs">
                  <div>
                    <p className="font-medium">{result.lessonName}</p>
                    <p className="text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <Badge variant={result.percentage >= 60 ? 'default' : 'destructive'}>
                    {result.percentage.toFixed(0)}%
                  </Badge>
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
