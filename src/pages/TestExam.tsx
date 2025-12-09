import { useState, useRef, useMemo, useEffect } from 'react';
import { FileText, Upload, Clock, CheckCircle, X, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Answer {
  questionNumber: number;
  selectedOption: number | null;
}

const TestExam = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [duration, setDuration] = useState<number>(60);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showFile, setShowFile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    }));
    setAnswers(initialAnswers);
    setTimeLeft(duration * 60);
    setIsExamStarted(true);
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
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === questionIndex
          ? { ...a, selectedOption: a.selectedOption === option ? null : option }
          : a
      )
    );
  };

  const resetExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExamStarted(false);
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

        {/* Tips */}
        <GlassCard delay={0.2}>
          <h3 className="text-lg font-semibold mb-4">💡 راهنما</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• فایل آزمون می‌تواند PDF یا تصویر باشد</li>
            <li>• تعداد سوالات را وارد کنید تا پاسخنامه ساخته شود</li>
            <li>• برای هر سوال ۴ گزینه خواهید داشت</li>
            <li>• با کلیک روی گزینه می‌توانید پاسخ را انتخاب یا لغو کنید</li>
            <li>• زمان آزمون به صورت معکوس شمارش می‌شود</li>
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
            <span className="font-semibold">آزمون در حال برگزاری</span>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFile(!showFile)}
            className="gap-2"
          >
            {showFile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showFile ? 'مخفی' : 'نمایش'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute top-16 bottom-0 left-0 right-0 flex">
        {/* PDF/File Viewer - Left Side */}
        {showFile && fileUrl && (
          <div className="w-1/2 h-full border-l border-white/10 bg-card/30">
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

        {/* Answer Sheet - Right Side */}
        <div className={cn(
          "h-full overflow-hidden flex flex-col",
          showFile && fileUrl ? "w-1/2" : "w-full"
        )}>
          <div className="p-4 border-b border-white/10 bg-card/30">
            <h3 className="text-lg font-semibold">پاسخنامه</h3>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className={cn(
              "grid gap-3",
              showFile && fileUrl 
                ? "grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-3 md:grid-cols-5 lg:grid-cols-8"
            )}>
              {answers.map((answer, index) => (
                <div
                  key={answer.questionNumber}
                  className="p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">سوال {answer.questionNumber}</span>
                    {answer.selectedOption !== null && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((option) => (
                      <button
                        key={option}
                        onClick={() => selectAnswer(index, option)}
                        className={cn(
                          "w-full aspect-square rounded-lg text-sm font-medium transition-all",
                          answer.selectedOption === option
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="p-4 border-t border-white/10 bg-card/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">پاسخ داده شده</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-2xl font-bold text-warning">{questionCount - answeredCount}</p>
                <p className="text-xs text-muted-foreground">بدون پاسخ</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <p className="text-2xl font-bold text-success">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">پیشرفت</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestExam;
