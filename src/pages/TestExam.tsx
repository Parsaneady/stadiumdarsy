import { useState, useRef } from 'react';
import { FileText, Upload, Clock, CheckCircle, X, RotateCcw, Eye, EyeOff } from 'lucide-react';
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
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [duration, setDuration] = useState<number>(60);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showFile, setShowFile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">آزمون در حال برگزاری</h1>
            <p className="text-muted-foreground mt-1">{answeredCount} از {questionCount} سوال پاسخ داده شده</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
          )}>
            <Clock className="w-5 h-5" />
            <span className="font-bold text-xl tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFile(!showFile)}
            className="glass-button"
          >
            {showFile ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
            {showFile ? 'مخفی کردن فایل' : 'نمایش فایل'}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetExam}
            className="glass-button text-destructive"
          >
            <X className="w-4 h-4 ml-2" />
            پایان آزمون
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">پیشرفت پاسخگویی</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Preview */}
        {showFile && file && (
          <GlassCard delay={0.1} className="h-[600px] overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">فایل آزمون</h3>
            <div className="h-[calc(100%-2rem)] overflow-auto rounded-lg bg-muted/20">
              {file.type === 'application/pdf' ? (
                <iframe
                  src={URL.createObjectURL(file)}
                  className="w-full h-full"
                  title="PDF Viewer"
                />
              ) : (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Exam file"
                  className="w-full h-auto object-contain"
                />
              )}
            </div>
          </GlassCard>
        )}

        {/* Answer Sheet */}
        <GlassCard delay={0.2} className={cn("h-[600px] overflow-hidden", !showFile || !file ? "lg:col-span-2" : "")}>
          <h3 className="text-lg font-semibold mb-4">پاسخنامه</h3>
          <div className="h-[calc(100%-2rem)] overflow-auto pr-2">
            <div className={cn(
              "grid gap-3",
              !showFile || !file ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-1 md:grid-cols-2"
            )}>
              {answers.map((answer, index) => (
                <div
                  key={answer.questionNumber}
                  className="p-3 rounded-xl bg-muted/20 border border-white/5"
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
        </GlassCard>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard delay={0.3} className="text-center">
          <p className="text-3xl font-bold text-primary">{answeredCount}</p>
          <p className="text-sm text-muted-foreground">پاسخ داده شده</p>
        </GlassCard>
        <GlassCard delay={0.35} className="text-center">
          <p className="text-3xl font-bold text-warning">{questionCount - answeredCount}</p>
          <p className="text-sm text-muted-foreground">بدون پاسخ</p>
        </GlassCard>
        <GlassCard delay={0.4} className="text-center">
          <p className="text-3xl font-bold text-success">{Math.round(progress)}%</p>
          <p className="text-sm text-muted-foreground">پیشرفت</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default TestExam;
