import { useState, useRef, useMemo, useEffect } from 'react';
import { FileText, Upload, Clock, CheckCircle, X, Eye, EyeOff, ArrowRight, Trophy, Target, XCircle, MinusCircle, History, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
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
}

const STORAGE_KEY = 'exam_results';

const TestExam = () => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved results
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setExamResults(JSON.parse(saved));
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
        toast({
          title: "✅ فایل آپلود شد",
          description: `${selectedFile.name} با موفقیت انتخاب شد.`,
        });
      } else {
        toast({
          title: "❌ فرمت نامعتبر",
          description: "لطفاً فایل PDF یا تصویر انتخاب کنید.",
          variant: "destructive",
        });
      }
    }
  };

  const startExam = () => {
    if (questionCount < 1 || questionCount > 200) {
      toast({
        title: "❌ تعداد نامعتبر",
        description: "تعداد سوالات باید بین ۱ تا ۲۰۰ باشد.",
        variant: "destructive",
      });
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
          toast({
            title: "⏰ زمان تمام شد!",
            description: "زمان آزمون به پایان رسید.",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectAnswer = (questionIndex: number, option: number) => {
    if (isExamFinished) return;
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === questionIndex
          ? { ...a, selectedOption: a.selectedOption === option ? null : option }
          : a
      )
    );
  };

  const setCorrectAnswer = (questionIndex: number, option: number) => {
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
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setIsExamFinished(true);
    setShowAnswerKey(true);
    toast({
      title: "📝 آزمون به پایان رسید",
      description: "حالا پاسخ‌های صحیح را مشخص کنید.",
    });
  };

  const calculateResults = () => {
    // Update isCorrect for all answers
    const updatedAnswers = answers.map(a => ({
      ...a,
      isCorrect: a.selectedOption !== null && a.correctOption !== null 
        ? a.selectedOption === a.correctOption 
        : null
    }));
    setAnswers(updatedAnswers);

    const correctCount = updatedAnswers.filter(a => a.isCorrect === true).length;
    const wrongCount = updatedAnswers.filter(a => a.selectedOption !== null && a.correctOption !== null && a.isCorrect === false).length;
    const blankCount = updatedAnswers.filter(a => a.selectedOption === null).length;
    
    // Konkour formula: correct - (wrong / 3)
    const rawScore = correctCount;
    const konkourScore = correctCount - (wrongCount / 3);
    const percentage = (konkourScore / questionCount) * 100;
    
    const timeSpent = initialTime - timeLeft;

    const result: ExamResult = {
      id: Date.now().toString(),
      name: examName || 'آزمون بدون نام',
      date: new Date().toISOString(),
      questionCount,
      correctCount,
      wrongCount,
      blankCount,
      rawScore,
      konkourScore: Math.max(0, konkourScore),
      percentage: Math.max(0, percentage),
      duration,
      timeSpent,
      answers: updatedAnswers,
    };

    const newResults = [result, ...examResults];
    setExamResults(newResults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));

    toast({
      title: "✅ کارنامه ذخیره شد",
      description: `درصد: ${percentage.toFixed(1)}%`,
    });

    return result;
  };

  const deleteResult = (id: string) => {
    const newResults = examResults.filter(r => r.id !== id);
    setExamResults(newResults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newResults));
    toast({
      title: "🗑️ نتیجه حذف شد",
    });
  };

  const resetExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExamStarted(false);
    setIsExamFinished(false);
    setShowAnswerKey(false);
    setAnswers([]);
    setTimeLeft(0);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter((a) => a.selectedOption !== null).length;
  const progress = questionCount > 0 ? (answeredCount / questionCount) * 100 : 0;

  // Calculate current stats
  const correctCount = answers.filter(a => a.isCorrect === true).length;
  const wrongCount = answers.filter(a => a.selectedOption !== null && a.correctOption !== null && a.isCorrect === false).length;
  const markedCorrectCount = answers.filter(a => a.correctOption !== null).length;

  // Setup screen (before exam starts)
  if (!isExamStarted) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">پنل آزمون</h1>
            <p className="text-muted-foreground mt-1">آپلود فایل و پاسخگویی به سوالات</p>
          </div>
        </div>

        {/* Setup Form */}
        <GlassCard delay={0.1}>
          <h3 className="text-lg font-semibold mb-6">تنظیمات آزمون</h3>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>آپلود فایل آزمون (PDF یا تصویر)</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  file ? "border-success bg-success/10" : "border-white/20 hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className={cn("w-12 h-12 mx-auto mb-4", file ? "text-success" : "text-muted-foreground")} />
                {file ? (
                  <div>
                    <p className="font-medium text-success">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">برای تغییر کلیک کنید</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">فایل خود را اینجا بکشید یا کلیک کنید</p>
                    <p className="text-sm text-muted-foreground mt-1">PDF یا تصویر</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Name */}
            <div className="space-y-2">
              <Label>نام آزمون</Label>
              <Input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="مثلاً آزمون جامع شیمی"
                className="glass-input"
              />
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label>تعداد سوالات</Label>
              <Input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                placeholder="مثلاً ۶۰"
                className="glass-input"
                min={1}
                max={200}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>مدت زمان آزمون (دقیقه)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="مثلاً ۶۰"
                className="glass-input"
                min={1}
              />
            </div>

            <Button
              onClick={startExam}
              className="w-full bg-gradient-to-r from-primary to-accent py-6 text-lg"
            >
              شروع آزمون
            </Button>
          </div>
        </GlassCard>

        {/* Exam History */}
        {examResults.length > 0 && (
          <GlassCard delay={0.2}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              بایگانی نتایج
            </h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {examResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 rounded-xl bg-muted/30 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{result.name}</p>
                      <span className="text-sm text-muted-foreground">
                        {new Date(result.date).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.answers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingResult(result)}
                          className="text-primary hover:text-primary"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          جزییات
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteResult(result.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-success">{result.correctCount}</p>
                      <p className="text-xs text-muted-foreground">صحیح</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-destructive">{result.wrongCount}</p>
                      <p className="text-xs text-muted-foreground">غلط</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-muted-foreground">{result.blankCount}</p>
                      <p className="text-xs text-muted-foreground">نزده</p>
                    </div>
                    <div>
                      <p className={cn(
                        "text-lg font-bold",
                        result.percentage >= 70 ? "text-success" :
                        result.percentage >= 50 ? "text-warning" : "text-destructive"
                      )}>
                        {result.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">درصد کنکور</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* View Result Details Modal */}
        {viewingResult && viewingResult.answers && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl overflow-auto">
            <div className="p-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingResult.name}</h2>
                  <p className="text-muted-foreground">
                    {new Date(viewingResult.date).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setViewingResult(null)}>
                  <X className="w-4 h-4 ml-2" />
                  بستن
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                  <p className="text-2xl font-bold text-success">{viewingResult.correctCount}</p>
                  <p className="text-sm text-muted-foreground">صحیح</p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-2xl font-bold text-destructive">{viewingResult.wrongCount}</p>
                  <p className="text-sm text-muted-foreground">غلط</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{viewingResult.blankCount}</p>
                  <p className="text-sm text-muted-foreground">نزده</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className={cn(
                    "text-2xl font-bold",
                    viewingResult.percentage >= 70 ? "text-success" :
                    viewingResult.percentage >= 50 ? "text-warning" : "text-destructive"
                  )}>
                    {viewingResult.percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">درصد کنکور</p>
                </div>
              </div>

              {/* Answer Sheet */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {viewingResult.answers.map((answer) => (
                  <div
                    key={answer.questionNumber}
                    className={cn(
                      "p-3 rounded-xl border",
                      answer.isCorrect === true && "bg-success/20 border-success/50",
                      answer.isCorrect === false && "bg-destructive/20 border-destructive/50",
                      answer.selectedOption === null && "bg-muted/30 border-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">سوال {answer.questionNumber}</span>
                      {answer.isCorrect === true && <CheckCircle className="w-4 h-4 text-success" />}
                      {answer.isCorrect === false && <XCircle className="w-4 h-4 text-destructive" />}
                      {answer.selectedOption === null && <MinusCircle className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((option) => (
                        <div
                          key={option}
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold",
                            answer.selectedOption === option
                              ? answer.correctOption === option
                                ? "bg-success text-white"
                                : "bg-destructive text-white"
                              : answer.correctOption === option
                                ? "bg-success/50 text-white ring-2 ring-success"
                                : "bg-muted/30"
                          )}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <GlassCard delay={0.3}>
          <h3 className="text-lg font-semibold mb-4">💡 راهنما</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• فایل آزمون می‌تواند PDF یا تصویر باشد</li>
            <li>• تعداد سوالات را وارد کنید تا پاسخنامه ساخته شود</li>
            <li>• برای هر سوال ۴ گزینه خواهید داشت</li>
            <li>• با کلیک روی گزینه می‌توانید پاسخ را انتخاب یا لغو کنید</li>
            <li>• بعد از پایان آزمون، پاسخ صحیح را مشخص کنید</li>
            <li>• درصد بر اساس فرمول کنکور محاسبه می‌شود (هر ۳ غلط = ۱ منفی)</li>
          </ul>
        </GlassCard>
      </div>
    );
  }

  // Fullscreen Exam Mode - completely isolated from Layout
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={resetExam}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-5 h-5" />
            خروج از آزمون
          </Button>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              {isExamFinished ? 'کارنامه آزمون' : 'آزمون در حال برگزاری'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">پیشرفت:</span>
            <span className="font-bold text-primary">{answeredCount}/{questionCount}</span>
            <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="h-6 w-px bg-white/20" />

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-mono",
            timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
          )}>
            <Clock className="w-5 h-5" />
            <span className="font-bold text-xl tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          {!isExamFinished && (
            <>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                <Button
                  variant={examViewMode === 'exam' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setExamViewMode('exam')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  آزمون
                </Button>
                <Button
                  variant={examViewMode === 'answer' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setExamViewMode('answer')}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  پاسخنامه
                </Button>
              </div>

              <Button
                onClick={finishExam}
                className="bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                پایان آزمون
              </Button>
            </>
          )}

          {isExamFinished && showAnswerKey && markedCorrectCount === questionCount && (
            <Button
              onClick={calculateResults}
              className="bg-success hover:bg-success/90 text-white"
            >
              <Trophy className="w-4 h-4 ml-2" />
              مشاهده کارنامه
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute top-16 bottom-0 left-0 right-0 flex">
        {/* PDF/File Viewer - Full Screen when in exam mode */}
        {examViewMode === 'exam' && fileUrl && !isExamFinished && (
          <div className="w-full h-full bg-card/30">
            <div className="h-full p-4">
              <div className="h-full rounded-xl overflow-hidden bg-muted/20 border border-white/10">
                {file?.type === 'application/pdf' ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full"
                    title="PDF Viewer"
                  />
                ) : (
                  <img
                    src={fileUrl}
                    alt="Exam file"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Answer Sheet - Full Screen when in answer mode */}
        {(examViewMode === 'answer' || isExamFinished) && (
        <div className="w-full h-full overflow-hidden flex flex-col">
          {showAnswerKey && (
            <div className="p-4 border-b border-white/10 bg-warning/10">
              <p className="text-center text-warning font-medium">
                📝 پاسخ صحیح هر سوال را با کلیک روی دکمه «✓» مشخص کنید
              </p>
            </div>
          )}
          
          <div className="p-4 border-b border-white/10 bg-card/30">
            <h3 className="text-lg font-semibold">
              {showAnswerKey ? 'تصحیح آزمون' : 'پاسخنامه'}
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
              {answers.map((answer, index) => (
                <div
                  key={answer.questionNumber}
                  className={cn(
                    "p-4 rounded-xl backdrop-blur-sm border transition-colors",
                    showAnswerKey && answer.isCorrect === true && "bg-success/20 border-success/50",
                    showAnswerKey && answer.isCorrect === false && "bg-destructive/20 border-destructive/50",
                    !showAnswerKey || answer.isCorrect === null ? "bg-card/50 border-white/10 hover:border-primary/30" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg">سوال {answer.questionNumber}</span>
                    {showAnswerKey && answer.isCorrect !== null && (
                      answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )
                    )}
                    {!showAnswerKey && answer.selectedOption !== null && (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((option) => (
                      <button
                        key={option}
                        onClick={() => selectAnswer(index, option)}
                        disabled={isExamFinished}
                        className={cn(
                          "w-12 h-12 rounded-lg text-base font-bold transition-all",
                          answer.selectedOption === option
                            ? showAnswerKey && answer.correctOption !== null
                              ? answer.correctOption === option
                                ? "bg-success text-white"
                                : "bg-destructive text-white"
                              : "bg-primary text-white shadow-lg shadow-primary/30"
                            : showAnswerKey && answer.correctOption === option
                              ? "bg-success/50 text-white ring-2 ring-success"
                              : "bg-muted/30 hover:bg-muted/50 disabled:hover:bg-muted/30"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  
                  {/* Correct answer selection */}
                  {showAnswerKey && (
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <p className="text-sm text-muted-foreground mb-2">پاسخ صحیح:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((option) => (
                          <button
                            key={`correct-${option}`}
                            onClick={() => setCorrectAnswer(index, option)}
                            className={cn(
                              "w-12 h-12 rounded-lg text-base font-bold transition-all",
                              answer.correctOption === option
                                ? "bg-success text-white"
                                : "bg-muted/20 hover:bg-success/30 border border-dashed border-success/30"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="p-4 border-t border-white/10 bg-card/30">
            <div className={cn(
              "grid gap-4 text-center",
              showAnswerKey ? "grid-cols-5" : "grid-cols-3"
            )}>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">پاسخ داده شده</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-2xl font-bold text-warning">{questionCount - answeredCount}</p>
                <p className="text-xs text-muted-foreground">بدون پاسخ</p>
              </div>
              {showAnswerKey && (
                <>
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-2xl font-bold text-success">{correctCount}</p>
                    <p className="text-xs text-muted-foreground">صحیح</p>
                  </div>
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                    <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
                    <p className="text-xs text-muted-foreground">غلط</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-2xl font-bold text-accent">{markedCorrectCount}/{questionCount}</p>
                    <p className="text-xs text-muted-foreground">تصحیح شده</p>
                  </div>
                </>
              )}
              {!showAnswerKey && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-2xl font-bold text-success">{Math.round(progress)}%</p>
                  <p className="text-xs text-muted-foreground">پیشرفت</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default TestExam;