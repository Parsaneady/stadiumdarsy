import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  Upload,
  FileUp,
  History
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

const ExamPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('simple');
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // Simple exam state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Simulator state
  const [simLessons, setSimLessons] = useState<SimulatorLesson[]>([]);
  const [simPdfFile, setSimPdfFile] = useState<File | null>(null);
  const simFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) fetchResults();
  }, [user]);

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

  const startSimpleExam = async () => {
    if (!questionCount) {
      toast.error('تعداد سوال را وارد کنید');
      return;
    }

    // Store exam config in sessionStorage
    const config = {
      type: 'simple',
      questionCount: parseInt(questionCount),
      timeMinutes: timeMinutes ? parseInt(timeMinutes) : undefined,
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));

    // Store PDF as base64 if exists
    if (pdfFile) {
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('examPdf', reader.result as string);
        navigate('/exam/test');
      };
      reader.readAsDataURL(pdfFile);
    } else {
      navigate('/exam/test');
    }
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

  const startSimulator = async () => {
    if (simLessons.length === 0) {
      toast.error('حداقل یک درس اضافه کنید');
      return;
    }
    if (simLessons.some(l => !l.name)) {
      toast.error('نام درس‌ها را وارد کنید');
      return;
    }

    const total = simLessons[simLessons.length - 1].questionEnd;
    
    const config = {
      type: 'simulator',
      questionCount: total,
      lessons: simLessons,
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));

    if (simPdfFile) {
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('examPdf', reader.result as string);
        navigate('/exam/test');
      };
      reader.readAsDataURL(simPdfFile);
    } else {
      navigate('/exam/test');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">پنل تست</h1>
            <p className="text-muted-foreground text-sm">PDF + پاسخبرگ + تصحیح</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="simple">تست معمولی</TabsTrigger>
            <TabsTrigger value="simulator">شبیه‌ساز</TabsTrigger>
          </TabsList>

          {/* ========== SIMPLE EXAM ========== */}
          <TabsContent value="simple" className="space-y-4">
            <GlassCard>
              <div className="space-y-4">
                {/* PDF Upload */}
                <div>
                  <Label className="mb-2 block text-sm">آپلود PDF (اختیاری)</Label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
                        <span className="font-medium">{pdfFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">کلیک کنید یا فایل را بکشید</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">تعداد سوال</Label>
                    <Input
                      type="number"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(e.target.value)}
                      placeholder="30"
                      className="bg-white/5 mt-1"
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
                      className="bg-white/5 mt-1"
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button onClick={startSimpleExam} className="w-full gap-2" size="lg">
                  <Play className="w-5 h-5" />
                  شروع تست
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* ========== SIMULATOR ========== */}
          <TabsContent value="simulator" className="space-y-4">
            <GlassCard>
              <div className="space-y-4">
                {/* PDF Upload */}
                <div>
                  <Label className="mb-2 block text-sm">آپلود PDF (اختیاری)</Label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
                        <FileUp className="w-5 h-5" />
                        <span className="font-medium">{simPdfFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">کلیک کنید یا فایل را بکشید</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">دفترچه‌ها (با قفل زمانی)</Label>
                    <Button size="sm" onClick={addSimLesson} className="gap-1">
                      <Plus className="w-4 h-4" />
                      افزودن
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    پس از اتمام زمان هر دفترچه، سوالات آن قفل می‌شوند
                  </p>

                  {simLessons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      دفترچه‌ها را اضافه کنید
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {simLessons.map((lesson, idx) => (
                        <div key={lesson.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                          <span className="text-muted-foreground w-6 text-center font-bold">{idx + 1}</span>
                          <Input
                            value={lesson.name}
                            onChange={(e) => updateSimLesson(lesson.id, 'name', e.target.value)}
                            placeholder="نام درس"
                            className="flex-1 bg-white/5"
                          />
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">از</span>
                            <Input
                              type="number"
                              value={lesson.questionStart}
                              onChange={(e) => updateSimLesson(lesson.id, 'questionStart', parseInt(e.target.value) || 1)}
                              className="w-14 bg-white/5"
                              dir="ltr"
                            />
                            <span className="text-muted-foreground">تا</span>
                            <Input
                              type="number"
                              value={lesson.questionEnd}
                              onChange={(e) => updateSimLesson(lesson.id, 'questionEnd', parseInt(e.target.value) || 1)}
                              className="w-14 bg-white/5"
                              dir="ltr"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={lesson.timeMinutes}
                              onChange={(e) => updateSimLesson(lesson.id, 'timeMinutes', parseInt(e.target.value) || 0)}
                              className="w-14 bg-white/5"
                              dir="ltr"
                            />
                            <span className="text-xs text-muted-foreground">دقیقه</span>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeSimLesson(lesson.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {simLessons.length > 0 && (
                  <Button onClick={startSimulator} className="w-full gap-2" size="lg">
                    <Play className="w-5 h-5" />
                    شروع شبیه‌ساز
                  </Button>
                )}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Results History */}
        {results.length > 0 && (
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">تاریخچه تست‌ها</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.slice(0, 10).map(result => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">{result.lessonName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString('fa-IR')} • {result.examType === 'simulator' ? 'شبیه‌ساز' : 'معمولی'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {result.correct}/{result.total}
                    </span>
                    <Badge variant={result.percentage >= 60 ? 'default' : 'destructive'}>
                      {result.percentage.toFixed(0)}%
                    </Badge>
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
