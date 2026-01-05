import { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Plus, FileText, BarChart3, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AnswerSheetData {
  id: string;
  questionCount: number;
  userAnswers: Record<number, number>;
  correctAnswers: Record<number, number>;
  createdAt: Date;
}

const OPTIONS = ['الف', 'ب', 'ج', 'د'];

const VirtualAnswerSheet = memo(() => {
  const [sheets, setSheets] = useState<AnswerSheetData[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [questionCountInput, setQuestionCountInput] = useState('');
  const [activeMode, setActiveMode] = useState<'simple' | 'analyzed'>('simple');

  const activeSheet = sheets.find(s => s.id === activeSheetId);

  const handleCreateSheet = useCallback(() => {
    const count = parseInt(questionCountInput);
    if (isNaN(count) || count <= 0 || count > 200) return;

    const newSheet: AnswerSheetData = {
      id: Math.random().toString(36).substr(2, 9),
      questionCount: count,
      userAnswers: {},
      correctAnswers: {},
      createdAt: new Date(),
    };

    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setQuestionCountInput('');
  }, [questionCountInput]);

  const handleSelectAnswer = useCallback((questionIndex: number, optionIndex: number, isCorrect: boolean) => {
    if (!activeSheetId) return;

    setSheets(prev => prev.map(sheet => {
      if (sheet.id !== activeSheetId) return sheet;

      if (isCorrect) {
        return {
          ...sheet,
          correctAnswers: { ...sheet.correctAnswers, [questionIndex]: optionIndex },
        };
      } else {
        return {
          ...sheet,
          userAnswers: { ...sheet.userAnswers, [questionIndex]: optionIndex },
        };
      }
    }));
  }, [activeSheetId]);

  const handleDeleteSheet = useCallback((sheetId: string) => {
    setSheets(prev => prev.filter(s => s.id !== sheetId));
    if (activeSheetId === sheetId) {
      setActiveSheetId(null);
    }
  }, [activeSheetId]);

  const getResults = useCallback(() => {
    if (!activeSheet) return { correct: 0, wrong: 0, blank: 0, percentage: 0 };

    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (let i = 0; i < activeSheet.questionCount; i++) {
      const userAnswer = activeSheet.userAnswers[i];
      const correctAnswer = activeSheet.correctAnswers[i];

      if (userAnswer === undefined) {
        blank++;
      } else if (correctAnswer !== undefined && userAnswer === correctAnswer) {
        correct++;
      } else if (correctAnswer !== undefined) {
        wrong++;
      } else {
        blank++;
      }
    }

    const answered = activeSheet.questionCount - blank;
    const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    return { correct, wrong, blank, percentage };
  }, [activeSheet]);

  const getOptionClass = useCallback((questionIndex: number, optionIndex: number, isCorrectMode: boolean) => {
    if (!activeSheet) return '';

    const isSelected = isCorrectMode
      ? activeSheet.correctAnswers[questionIndex] === optionIndex
      : activeSheet.userAnswers[questionIndex] === optionIndex;

    if (activeMode === 'analyzed' && !isCorrectMode) {
      const userAnswer = activeSheet.userAnswers[questionIndex];
      const correctAnswer = activeSheet.correctAnswers[questionIndex];

      if (userAnswer === optionIndex) {
        if (correctAnswer === optionIndex) {
          return 'bg-success/30 text-success border-success';
        } else {
          return 'bg-destructive/30 text-destructive border-destructive';
        }
      }
      if (correctAnswer === optionIndex) {
        return 'bg-success/20 text-success border-success/50';
      }
    }

    if (isSelected) {
      return isCorrectMode
        ? 'bg-primary/30 text-primary border-primary'
        : 'bg-secondary/30 text-secondary border-secondary';
    }

    return 'bg-muted/30 hover:bg-muted/50 border-muted';
  }, [activeSheet, activeMode]);

  if (!activeSheet) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            پاسخنامه مجازی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="تعداد سوالات (حداکثر 200)"
              value={questionCountInput}
              onChange={(e) => setQuestionCountInput(e.target.value)}
              min={1}
              max={200}
              className="flex-1"
            />
            <Button onClick={handleCreateSheet} className="gap-2">
              <Plus className="w-4 h-4" />
              ایجاد
            </Button>
          </div>

          {sheets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">پاسخنامه‌های قبلی:</p>
              {sheets.map(sheet => (
                <div
                  key={sheet.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setActiveSheetId(sheet.id)}
                >
                  <span className="text-sm">
                    {sheet.questionCount} سوال - {new Date(sheet.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(sheet.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const results = getResults();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            پاسخنامه ({activeSheet.questionCount} سوال)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSheetId(null)}
          >
            بازگشت
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'simple' | 'analyzed')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="gap-2">
              <FileText className="w-4 h-4" />
              ثبت پاسخ
            </TabsTrigger>
            <TabsTrigger value="analyzed" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              تحلیل شده
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">پاسخ‌های شما</p>
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {Array.from({ length: activeSheet.questionCount }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-8 text-sm text-muted-foreground">{i + 1}.</span>
                        <div className="flex gap-1 flex-1">
                          {OPTIONS.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(i, optIdx, false)}
                              className={cn(
                                'w-8 h-8 rounded-md text-xs font-medium border transition-all',
                                getOptionClass(i, optIdx, false)
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">کلید پاسخ</p>
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2">
                    {Array.from({ length: activeSheet.questionCount }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-8 text-sm text-muted-foreground">{i + 1}.</span>
                        <div className="flex gap-1 flex-1">
                          {OPTIONS.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(i, optIdx, true)}
                              className={cn(
                                'w-8 h-8 rounded-md text-xs font-medium border transition-all',
                                getOptionClass(i, optIdx, true)
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyzed" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-lg bg-success/20">
                <Check className="w-5 h-5 mx-auto text-success mb-1" />
                <p className="text-lg font-bold text-success">{results.correct}</p>
                <p className="text-xs text-muted-foreground">صحیح</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/20">
                <X className="w-5 h-5 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive">{results.wrong}</p>
                <p className="text-xs text-muted-foreground">غلط</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-muted-foreground">{results.blank}</p>
                <p className="text-xs text-muted-foreground">نزده</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/20">
                <p className="text-lg font-bold text-primary">{results.percentage}%</p>
                <p className="text-xs text-muted-foreground">درصد</p>
              </div>
            </div>

            <ScrollArea className="h-[250px] pr-2">
              <div className="space-y-2">
                {Array.from({ length: activeSheet.questionCount }, (_, i) => {
                  const userAnswer = activeSheet.userAnswers[i];
                  const correctAnswer = activeSheet.correctAnswers[i];
                  const isCorrect = userAnswer !== undefined && userAnswer === correctAnswer;
                  const isWrong = userAnswer !== undefined && correctAnswer !== undefined && userAnswer !== correctAnswer;

                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg',
                        isCorrect && 'bg-success/10',
                        isWrong && 'bg-destructive/10',
                        !isCorrect && !isWrong && 'bg-muted/20'
                      )}
                    >
                      <span className="w-8 text-sm text-muted-foreground">{i + 1}.</span>
                      <div className="flex gap-1 flex-1">
                        {OPTIONS.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={cn(
                              'w-8 h-8 rounded-md text-xs font-medium border flex items-center justify-center',
                              getOptionClass(i, optIdx, false)
                            )}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      <div className="w-6">
                        {isCorrect && <Check className="w-4 h-4 text-success" />}
                        {isWrong && <X className="w-4 h-4 text-destructive" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

VirtualAnswerSheet.displayName = 'VirtualAnswerSheet';

export default VirtualAnswerSheet;
