import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { FileText, Upload, Clock, CheckCircle, X, Eye, EyeOff, ArrowRight, Trophy, Target, XCircle, MinusCircle, History, Trash2, Edit2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Answer {
  questionNumber: number;
  selectedOption: number | null;
  correctOption: number | null;
  isCorrect: boolean | null;
}

interface ExamResult {
  id: string;
  name: string;
  date: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  rawScore: number;
  konkourScore: number;
  percentage: number;
  duration: number;
  timeSpent: number;
  answers?: Answer[];
  noWrongPenalty?: boolean;
  noWrongPercentage?: number;
}

const STORAGE_KEY = 'exam_results';

const ExamPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [examName, setExamName] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [duration, setDuration] = useState<number>(60);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [examViewMode, setExamViewMode] = useState<'exam' | 'answer'>('exam');
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [viewingResult, setViewingResult] = useState<ExamResult | null>(null);
  const [noWrongPenalty, setNoWrongPenalty] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [hasResultSaved, setHasResultSaved] = useState(false); // Prevent multiple saves
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved results
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setExamResults(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Create stable URL for file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        toast.success(`فایل "${selectedFile.name}" آپلود شد`);
      } else {
        toast.error('لطفاً فایل PDF یا تصویر انتخاب کنید');
      }
    }
  };

  const startExam = () => {
    if (questionCount < 1 || questionCount > 200) {
      toast.error('تعداد سوالات باید بین ۱ تا ۲۰۰ باشد');
      return;
    }

    const initialAnswers: Answer[] = Array.from({ length: questionCount }, (_, i) => ({
      questionNumber: i + 1,
      selectedOption: null,
      correctOption: null,
      isCorrect: null,
    }));
    setAnswers(initialAnswers);
    setTimeLeft(duration * 60);
    setInitialTime(duration * 60);
    setIsExamStarted(true);
    setIsExamFinished(false);
    setShowAnswerKey(false);
    setIsRunning(true);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsRunning(false);
          toast.info('زمان آزمون تمام شد');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectAnswer = useCallback((questionIndex: number, option: number) => {
    if (isExamFinished) return;
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === questionIndex
          ? { ...a, selectedOption: a.selectedOption === option ? null : option }
          : a
      )
    );
  }, [isExamFinished]);

  const setCorrectAnswer = useCallback((questionIndex: number, option: number) => {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === questionIndex
          ? { 
              ...a, 
              correctOption: a.correctOption === option ? null : option,
              isCorrect: a.selectedOption !== null ? (a.selectedOption === (a.correctOption === option ? null : option)) : null
            }
          : a
      )
    );
  }, []);

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setIsExamFinished(true);
    setShowAnswerKey(true);
    toast.info('آزمون به پایان رسید - پاسخ‌های صحیح را مشخص کنید');
  };

  const calculateResults = (useNoWrongPenalty: boolean = noWrongPenalty) => {
    // Prevent multiple saves - only allow one save per exam session
    if (hasResultSaved && !editingResultId) {
      toast.info('عملکرد این آزمون قبلاً ثبت شده است');
      return null;
    }

    const updatedAnswers = answers.map(a => ({
      ...a,
      isCorrect: a.selectedOption !== null && a.correctOption !== null 
        ? a.selectedOption === a.correctOption 
        : null
    }));
    setAnswers(updatedAnswers);

    const correctCount = updatedAnswers.filter(a => a.isCorrect === true).length;
    let wrongCount = updatedAnswers.filter(a => a.selectedOption !== null && a.correctOption !== null && a.isCorrect === false).length;
    let blankCount = updatedAnswers.filter(a => a.selectedOption === null).length;
    
    if (useNoWrongPenalty) {
      blankCount = blankCount + wrongCount;
      wrongCount = 0;
    }
    
    const rawScore = correctCount;
    const konkourScore = correctCount - (wrongCount / 3);
    const percentage = (konkourScore / questionCount) * 100;
    const noWrongPercentage = (correctCount / questionCount) * 100;
    const timeSpent = initialTime - timeLeft;

    const result: ExamResult = {
      id: editingResultId || Date.now().toString(),
      name: examName || 'آزمون بدون نام',
      date: new Date().toISOString(),
      questionCount,
      correctCount,
      wrongCount,
      blankCount,
      rawScore,
      konkourScore,
      percentage,
      duration,
      timeSpent,
      answers: updatedAnswers,
      noWrongPenalty: useNoWrongPenalty,
      noWrongPercentage,
    };

    let newResults: ExamResult[];
    if (editingResultId) {
      newResults = examResults.map(r => r.id === editingResultId ? result : r);
      setEditingResultId(null);
    } else {
      newResults = [result, ...examResults];
      setHasResultSaved(true); // Mark as saved to prevent duplicate saves
    }
    setExamResults(newResults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));

    toast.success(`کارنامه ذخیره شد - درصد: ${percentage.toFixed(1)}%`);
    return result;
  };

  const startCorrection = (result: ExamResult) => {
    if (!result.answers) return;
    
    setEditingResultId(result.id);
    setExamName(result.name);
    setQuestionCount(result.questionCount);
    setDuration(result.duration);
    setAnswers(result.answers);
    setTimeLeft(0);
    setInitialTime(result.duration * 60);
    setIsExamStarted(true);
    setIsExamFinished(true);
    setShowAnswerKey(true);
    setNoWrongPenalty(result.noWrongPenalty || false);
    setViewingResult(null);
  };

  const deleteResult = (id: string) => {
    const newResults = examResults.filter(r => r.id !== id);
    setExamResults(newResults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
    toast.success('نتیجه حذف شد');
  };

  const resetExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExamStarted(false);
    setIsExamFinished(false);
    setShowAnswerKey(false);
    setAnswers([]);
    setTimeLeft(0);
    setIsRunning(false);
    setHasResultSaved(false); // Reset the save flag for new exam
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter((a) => a.selectedOption !== null).length;
  const progress = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;
  const correctCount = answers.filter(a => a.isCorrect === true).length;
  const wrongCount = answers.filter(a => a.selectedOption !== null && a.correctOption !== null && a.isCorrect === false).length;
  const markedCorrectCount = answers.filter(a => a.correctOption !== null).length;

  // Setup screen
  if (!isExamStarted) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">پنل تست</h1>
              <p className="text-muted-foreground text-sm">آپلود فایل و پاسخگویی به سوالات</p>
            </div>
          </div>

          {/* Setup Form */}
          <GlassCard>
            <h3 className="font-semibold mb-4">تنظیمات تست</h3>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label className="text-sm">آپلود فایل (PDF یا تصویر)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mt-2",
                    file ? "border-success bg-success/10" : "border-white/20 hover:border-primary/50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className={cn("w-8 h-8 mx-auto mb-2", file ? "text-success" : "text-muted-foreground")} />
                  {file ? (
                    <p className="font-medium text-success">{file.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">کلیک کنید یا فایل را بکشید</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm">نام تست</Label>
                <Input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثلاً تست جامع شیمی"
                  className="bg-white/5 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">تعداد سوالات</Label>
                  <Input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="bg-white/5 mt-1"
                    min={1}
                    max={200}
                  />
                </div>
                <div>
                  <Label className="text-sm">زمان (دقیقه)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="bg-white/5 mt-1"
                    min={1}
                  />
                </div>
              </div>

              <Button onClick={startExam} className="w-full" size="lg">
                شروع تست
              </Button>
            </div>
          </GlassCard>

          {/* History */}
          {examResults.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                بایگانی نتایج
              </h3>
              <div className="space-y-3 max-h-80 overflow-auto">
                {examResults.map((result) => (
                  <div key={result.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.date).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {result.answers && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setViewingResult(result)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => startCorrection(result)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteResult(result.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="font-bold text-success">{result.correctCount}</p>
                        <p className="text-xs text-muted-foreground">صحیح</p>
                      </div>
                      <div>
                        <p className="font-bold text-destructive">{result.wrongCount}</p>
                        <p className="text-xs text-muted-foreground">غلط</p>
                      </div>
                      <div>
                        <p className="font-bold text-muted-foreground">{result.blankCount}</p>
                        <p className="text-xs text-muted-foreground">نزده</p>
                      </div>
                      <div>
                        <p className={cn("font-bold", result.percentage >= 0 ? "text-success" : "text-destructive")}>
                          {result.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">درصد</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Result Modal */}
          {viewingResult && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingResult(null)}>
              <div className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{viewingResult.name}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setViewingResult(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-success/20 rounded-xl">
                    <p className="text-2xl font-bold text-success">{viewingResult.correctCount}</p>
                    <p className="text-xs">صحیح</p>
                  </div>
                  <div className="text-center p-4 bg-destructive/20 rounded-xl">
                    <p className="text-2xl font-bold text-destructive">{viewingResult.wrongCount}</p>
                    <p className="text-xs">غلط</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-xl">
                    <p className="text-2xl font-bold">{viewingResult.blankCount}</p>
                    <p className="text-xs">نزده</p>
                  </div>
                </div>

                <div className="text-center p-6 bg-primary/20 rounded-xl">
                  <p className="text-4xl font-bold text-primary">{viewingResult.percentage.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-1">درصد کل</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Exam in progress
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={resetExam}>
              <X className="w-5 h-5" />
            </Button>
            <h1 className="font-bold">{examName || 'تست'}</h1>
          </div>

          <div className="flex items-center gap-4">
            {isRunning && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {answeredCount}/{questionCount}
            </div>

            {!isExamFinished ? (
              <Button onClick={finishExam} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                پایان و تصحیح
              </Button>
            ) : (
              <Button onClick={() => calculateResults(noWrongPenalty)} className="gap-2">
                <Trophy className="w-4 h-4" />
                ذخیره نتایج
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex">
        {/* PDF Viewer */}
        {fileUrl && (
          <div className="flex-1 border-l border-border/50 overflow-hidden">
            {file?.type === 'application/pdf' ? (
              <iframe src={fileUrl} className="w-full h-full" />
            ) : (
              <div className="w-full h-full overflow-auto p-4">
                <img src={fileUrl} alt="تست" className="max-w-full" />
              </div>
            )}
          </div>
        )}
        
        {/* Answer Sheet */}
        <div className={cn("h-full overflow-y-auto p-4", fileUrl ? "w-96" : "w-full max-w-2xl mx-auto")}>
          {showAnswerKey && (
            <div className="mb-4 flex items-center gap-2">
              <Button
                variant={examViewMode === 'exam' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExamViewMode('exam')}
              >
                پاسخ‌های من
              </Button>
              <Button
                variant={examViewMode === 'answer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExamViewMode('answer')}
              >
                کلید سوالات
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-5 gap-2">
            {answers.map((answer, idx) => (
              <div key={idx} className="p-2 bg-white/5 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">{answer.questionNumber}</p>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((opt) => {
                    const isSelected = showAnswerKey && examViewMode === 'answer' 
                      ? answer.correctOption === opt
                      : answer.selectedOption === opt;
                    const isCorrect = showAnswerKey && answer.correctOption === opt;
                    const isWrong = showAnswerKey && answer.selectedOption === opt && answer.correctOption !== opt && answer.correctOption !== null;
                    
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (showAnswerKey && examViewMode === 'answer') {
                            setCorrectAnswer(idx, opt);
                          } else if (!isExamFinished) {
                            selectAnswer(idx, opt);
                          }
                        }}
                        className={cn(
                          "w-6 h-6 rounded-full text-xs font-bold transition-all",
                          isSelected ? "bg-primary text-white" : "bg-white/10 hover:bg-white/20",
                          isCorrect && examViewMode === 'exam' && "ring-2 ring-success",
                          isWrong && examViewMode === 'exam' && "bg-destructive text-white"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPanel;
