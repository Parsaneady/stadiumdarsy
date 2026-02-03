import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Plus, Trash2, Check, ArrowLeft, Eye, Edit2, RotateCcw, Filter } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExamStyleAnswerSheet } from '@/components/exam/ExamStyleAnswerSheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TestBook {
  id: string;
  name: string;
  total_questions: number;
  answers: Record<number, number>;
  correct_answers: Record<number, number>;
  marked_questions: number[];
  created_at: string;
}

type ViewMode = 'list' | 'answers' | 'correction' | 'results';

const TestBookPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [books, setBooks] = useState<TestBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<TestBook | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookQuestions, setNewBookQuestions] = useState(100);
  const [loading, setLoading] = useState(true);
  
  // Range filter state
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(100);
  const [showRangeFilter, setShowRangeFilter] = useState(false);
  const [stepMultiplier, setStepMultiplier] = useState(1);
  
  // Reset dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStart, setResetStart] = useState(1);
  const [resetEnd, setResetEnd] = useState(100);

  // Load books from database
  const loadBooks = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('test_books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBooks(data?.map(book => ({
        ...book,
        answers: (book.answers as Record<number, number>) || {},
        correct_answers: (book.correct_answers as Record<number, number>) || {},
        marked_questions: (book.marked_questions as number[]) || [],
      })) || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Update range when book changes (only on initial book selection)
  const [prevBookId, setPrevBookId] = useState<string | null>(null);
  
  useEffect(() => {
    if (selectedBook && selectedBook.id !== prevBookId) {
      setRangeStart(1);
      setRangeEnd(selectedBook.total_questions);
      setResetStart(1);
      setResetEnd(selectedBook.total_questions);
      setStepMultiplier(1);
      setPrevBookId(selectedBook.id);
    }
  }, [selectedBook, prevBookId]);

  // Create new book
  const handleCreateBook = async () => {
    if (!user || !newBookName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('test_books')
        .insert({
          user_id: user.id,
          name: newBookName.trim(),
          total_questions: newBookQuestions,
          answers: {},
          correct_answers: {},
          marked_questions: [],
        })
        .select()
        .single();

      if (error) throw error;

      const newBook: TestBook = {
        ...data,
        answers: {},
        correct_answers: {},
        marked_questions: [],
      };
      
      setBooks(prev => [newBook, ...prev]);
      setIsCreating(false);
      setNewBookName('');
      setNewBookQuestions(100);
      toast.success('کتاب تست جدید ایجاد شد');
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('خطا در ایجاد کتاب');
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('test_books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      setBooks(prev => prev.filter(b => b.id !== bookId));
      toast.success('کتاب حذف شد');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('خطا در حذف کتاب');
    }
  };

  // Save answers
  const saveAnswers = useCallback(async (book: TestBook, answers: Record<number, number>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('test_books')
        .update({ answers: answers as unknown as any })
        .eq('id', book.id);

      if (error) throw error;

      setBooks(prev => prev.map(b => 
        b.id === book.id ? { ...b, answers } : b
      ));
      setSelectedBook(prev => prev ? { ...prev, answers } : null);
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  }, [user]);

  // Save correct answers
  const saveCorrectAnswers = useCallback(async (book: TestBook, correctAnswers: Record<number, number>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('test_books')
        .update({ correct_answers: correctAnswers as unknown as any })
        .eq('id', book.id);

      if (error) throw error;

      setBooks(prev => prev.map(b => 
        b.id === book.id ? { ...b, correct_answers: correctAnswers } : b
      ));
      setSelectedBook(prev => prev ? { ...prev, correct_answers: correctAnswers } : null);
    } catch (error) {
      console.error('Error saving correct answers:', error);
    }
  }, [user]);

  // Save marked questions
  const saveMarkedQuestions = useCallback(async (book: TestBook, markedArr: number[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('test_books')
        .update({ marked_questions: markedArr as unknown as any })
        .eq('id', book.id);

      if (error) throw error;

      setBooks(prev => prev.map(b => 
        b.id === book.id ? { ...b, marked_questions: markedArr } : b
      ));
      setSelectedBook(prev => prev ? { ...prev, marked_questions: markedArr } : null);
    } catch (error) {
      console.error('Error saving marked questions:', error);
    }
  }, [user]);

  // Handle toggle mark
  const handleToggleMark = useCallback((localIndex: number, filteredIndices: number[]) => {
    if (!selectedBook) return;
    
    const actualIndex = filteredIndices[localIndex];
    const newMarked = [...selectedBook.marked_questions];
    const existingIdx = newMarked.indexOf(actualIndex);
    
    if (existingIdx >= 0) {
      newMarked.splice(existingIdx, 1);
    } else {
      newMarked.push(actualIndex);
    }
    
    saveMarkedQuestions(selectedBook, newMarked);
  }, [selectedBook, saveMarkedQuestions]);

  // Get filtered question indices based on range and step
  const getFilteredIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = rangeStart - 1; i < rangeEnd; i += stepMultiplier) {
      indices.push(i);
    }
    return indices;
  }, [rangeStart, rangeEnd, stepMultiplier]);

  // Handle answer select with step support
  const handleAnswerSelectWithStep = (questionIndex: number, option: number) => {
    if (!selectedBook) return;
    
    const actualIndex = getFilteredIndices[questionIndex];
    
    const newAnswers = { ...selectedBook.answers };
    if (newAnswers[actualIndex] === option) {
      delete newAnswers[actualIndex];
    } else {
      newAnswers[actualIndex] = option;
    }
    
    saveAnswers(selectedBook, newAnswers);
  };

  // Handle correct answer select with step support
  const handleCorrectAnswerSelectWithStep = (questionIndex: number, option: number) => {
    if (!selectedBook) return;
    
    const actualIndex = getFilteredIndices[questionIndex];
    
    const newCorrectAnswers = { ...selectedBook.correct_answers };
    if (newCorrectAnswers[actualIndex] === option) {
      delete newCorrectAnswers[actualIndex];
    } else {
      newCorrectAnswers[actualIndex] = option;
    }
    
    saveCorrectAnswers(selectedBook, newCorrectAnswers);
  };

  // Reset answers in range
  const handleResetRange = async () => {
    if (!selectedBook || !user) return;
    
    const newAnswers = { ...selectedBook.answers };
    for (let i = resetStart - 1; i < resetEnd; i++) {
      delete newAnswers[i];
    }
    
    await saveAnswers(selectedBook, newAnswers);
    setShowResetDialog(false);
    toast.success(`پاسخ‌های ${resetStart} تا ${resetEnd} ریست شدند`);
  };

  // Calculate stats for range
  const calculateRangeStats = (book: TestBook, start: number, end: number) => {
    const rangeSize = end - start + 1;
    let answeredCount = 0;
    let correctCount = 0;
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    
    for (let i = start - 1; i < end; i++) {
      if (book.answers[i] !== undefined) answeredCount++;
      if (book.correct_answers[i] !== undefined) correctCount++;
      
      if (book.correct_answers[i] !== undefined) {
        if (book.answers[i] === undefined) {
          blank++;
        } else if (book.answers[i] === book.correct_answers[i]) {
          correct++;
        } else {
          wrong++;
        }
      }
    }
    
    const score = correct - (wrong / 3);
    const percentage = correctCount > 0 ? (score / correctCount) * 100 : 0;
    
    return { rangeSize, answeredCount, correctCount, correct, wrong, blank, percentage };
  };

  // Calculate total stats
  const calculateStats = (book: TestBook) => {
    return calculateRangeStats(book, 1, book.total_questions);
  };

  // Get filtered answers for display (with step support)
  const getFilteredAnswersWithStep = useMemo(() => {
    if (!selectedBook) return {};
    
    const filtered: Record<number, number> = {};
    getFilteredIndices.forEach((actualIdx, displayIdx) => {
      if (selectedBook.answers[actualIdx] !== undefined) {
        filtered[displayIdx] = selectedBook.answers[actualIdx];
      }
    });
    return filtered;
  }, [selectedBook, getFilteredIndices]);

  const getFilteredCorrectAnswersWithStep = useMemo(() => {
    if (!selectedBook) return {};
    
    const filtered: Record<number, number> = {};
    getFilteredIndices.forEach((actualIdx, displayIdx) => {
      if (selectedBook.correct_answers[actualIdx] !== undefined) {
        filtered[displayIdx] = selectedBook.correct_answers[actualIdx];
      }
    });
    return filtered;
  }, [selectedBook, getFilteredIndices]);

  // Get filtered marked questions for display
  const getFilteredMarkedQuestions = useMemo(() => {
    if (!selectedBook) return new Set<number>();
    
    const markedSet = new Set<number>();
    getFilteredIndices.forEach((actualIdx, displayIdx) => {
      if (selectedBook.marked_questions.includes(actualIdx)) {
        markedSet.add(displayIdx);
      }
    });
    return markedSet;
  }, [selectedBook, getFilteredIndices]);

  // Back to list
  const handleBack = () => {
    setSelectedBook(null);
    setViewMode('list');
  };

  // Range filter component with step multiplier
  const RangeFilter = () => (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">از</span>
        <Input
          type="number"
          value={rangeStart}
          onChange={(e) => setRangeStart(Math.max(1, Math.min(Number(e.target.value), rangeEnd)))}
          min={1}
          max={selectedBook?.total_questions || 100}
          className="w-20 h-8"
        />
        <span className="text-sm text-muted-foreground">تا</span>
        <Input
          type="number"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(Math.min(selectedBook?.total_questions || 100, Math.max(Number(e.target.value), rangeStart)))}
          min={1}
          max={selectedBook?.total_questions || 100}
          className="w-20 h-8"
        />
      </div>
      
      <div className="flex items-center gap-2 border-r border-white/20 pr-3">
        <span className="text-sm text-muted-foreground">ضریب:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 5].map((step) => (
            <Button
              key={step}
              size="sm"
              variant={stepMultiplier === step ? "default" : "ghost"}
              className={`w-8 h-8 p-0 ${stepMultiplier === step ? 'bg-primary' : ''}`}
              onClick={() => setStepMultiplier(step)}
            >
              {step}
            </Button>
          ))}
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setRangeStart(1);
          setRangeEnd(selectedBook?.total_questions || 100);
          setStepMultiplier(1);
        }}
      >
        ریست فیلتر
      </Button>
      
      <span className="text-xs text-muted-foreground">
        ({getFilteredIndices.length} سوال)
      </span>
    </div>
  );

  // Render book list
  if (viewMode === 'list') {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl font-bold gradient-text mb-2">پاسخ‌برگ کتاب تست</h1>
            <p className="text-muted-foreground">
              مدیریت و پیگیری پاسخ‌های کتاب‌های تستی
            </p>
          </div>

          <GlassCard>
            <div className="p-6 space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate('/study-desk')} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  بازگشت
                </Button>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  کتاب جدید
                </Button>
              </div>

              {/* Create form */}
              {isCreating && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نام کتاب</Label>
                      <Input
                        value={newBookName}
                        onChange={(e) => setNewBookName(e.target.value)}
                        placeholder="مثلاً: زرد ریاضی"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>تعداد سوالات</Label>
                      <Input
                        type="number"
                        value={newBookQuestions}
                        onChange={(e) => setNewBookQuestions(Number(e.target.value))}
                        min={1}
                        max={5000}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>
                      انصراف
                    </Button>
                    <Button onClick={handleCreateBook} disabled={!newBookName.trim()}>
                      ایجاد
                    </Button>
                  </div>
                </div>
              )}

              {/* Books list */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
              ) : books.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">هنوز کتاب تستی اضافه نکرده‌اید</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {books.map(book => {
                    const stats = calculateStats(book);
                    const hasCorrectAnswers = stats.correctCount > 0;
                    
                    return (
                      <div
                        key={book.id}
                        className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-xl">{book.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {book.total_questions} سوال • {stats.answeredCount} پاسخ داده شده
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/20"
                            onClick={() => handleDeleteBook(book.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full h-3 rounded-full bg-white/10 mb-4">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${(stats.answeredCount / book.total_questions) * 100}%` }}
                          />
                        </div>
                        
                        {/* Stats if has correct answers */}
                        {hasCorrectAnswers && (
                          <div className="flex gap-6 text-sm mb-4 flex-wrap">
                            <span className="text-success font-medium">✓ {stats.correct} صحیح</span>
                            <span className="text-destructive font-medium">✗ {stats.wrong} غلط</span>
                            <span className="text-muted-foreground">○ {stats.blank} نزده</span>
                            <span className={`font-bold ${stats.percentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {stats.percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 flex-1"
                            onClick={() => {
                              setSelectedBook(book);
                              setViewMode('answers');
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                            پاسخ‌برگ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 flex-1"
                            onClick={() => {
                              setSelectedBook(book);
                              setViewMode('correction');
                            }}
                          >
                            <Check className="w-4 h-4" />
                            کلید
                          </Button>
                          {hasCorrectAnswers && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 flex-1"
                              onClick={() => {
                                setSelectedBook(book);
                                setViewMode('results');
                              }}
                            >
                              <Eye className="w-4 h-4" />
                              عملکرد
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  // Render answer sheet view
  if (viewMode === 'answers' && selectedBook) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="font-bold text-xl">{selectedBook.name}</h2>
                    <p className="text-sm text-muted-foreground">پاسخ‌برگ خام • سوال {rangeStart} تا {rangeEnd}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                  ریست
                </Button>
              </div>
              
              <RangeFilter />
              
              <div className="h-[calc(100vh-340px)] min-h-[400px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <ExamStyleAnswerSheet
                  questionCount={getFilteredIndices.length}
                  answers={getFilteredAnswersWithStep}
                  onAnswerSelect={handleAnswerSelectWithStep}
                  startIndex={0}
                  markedQuestions={getFilteredMarkedQuestions}
                  onToggleMark={(idx) => handleToggleMark(idx, getFilteredIndices)}
                  showMarkOption={true}
                  actualQuestionNumbers={getFilteredIndices.map(i => i + 1)}
                />
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Reset Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ریست پاسخ‌ها</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                پاسخ‌های بازه مشخص شده پاک خواهند شد
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <Label>از سوال</Label>
                  <Input
                    type="number"
                    value={resetStart}
                    onChange={(e) => setResetStart(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={selectedBook.total_questions}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>تا سوال</Label>
                  <Input
                    type="number"
                    value={resetEnd}
                    onChange={(e) => setResetEnd(Math.min(selectedBook.total_questions, Number(e.target.value)))}
                    min={1}
                    max={selectedBook.total_questions}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowResetDialog(false)}>
                انصراف
              </Button>
              <Button variant="destructive" onClick={handleResetRange}>
                ریست
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  // Render correction view
  if (viewMode === 'correction' && selectedBook) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="font-bold text-xl">{selectedBook.name}</h2>
                  <p className="text-sm text-muted-foreground">وارد کردن کلید پاسخ • سوال {rangeStart} تا {rangeEnd}</p>
                </div>
              </div>
              
              <RangeFilter />
              
              <div className="h-[calc(100vh-340px)] min-h-[400px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <ExamStyleAnswerSheet
                  questionCount={getFilteredIndices.length}
                  answers={getFilteredCorrectAnswersWithStep}
                  onAnswerSelect={handleCorrectAnswerSelectWithStep}
                  startIndex={0}
                  actualQuestionNumbers={getFilteredIndices.map(i => i + 1)}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  // Render results view
  if (viewMode === 'results' && selectedBook) {
    const rangeStats = calculateRangeStats(selectedBook, rangeStart, rangeEnd);
    
    return (
      <AppLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="font-bold text-xl">{selectedBook.name}</h2>
                  <p className="text-sm text-muted-foreground">عملکرد • سوال {rangeStart} تا {rangeEnd}</p>
                </div>
              </div>
              
              <RangeFilter />
              
              {/* Stats cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-success/20 border border-success/30 text-center">
                  <div className="text-2xl font-bold text-success">{rangeStats.correct}</div>
                  <div className="text-sm text-muted-foreground">صحیح</div>
                </div>
                <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/30 text-center">
                  <div className="text-2xl font-bold text-destructive">{rangeStats.wrong}</div>
                  <div className="text-sm text-muted-foreground">غلط</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{rangeStats.blank}</div>
                  <div className="text-sm text-muted-foreground">نزده</div>
                </div>
                <div className={`p-4 rounded-xl border text-center ${
                  rangeStats.percentage >= 0 
                    ? 'bg-success/20 border-success/30' 
                    : 'bg-destructive/20 border-destructive/30'
                }`}>
                  <div className={`text-2xl font-bold ${
                    rangeStats.percentage >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {rangeStats.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">درصد</div>
                </div>
              </div>
              
              {/* Answer sheet with results */}
              <div className="h-[calc(100vh-440px)] min-h-[300px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
                <ExamStyleAnswerSheet
                  questionCount={getFilteredIndices.length}
                  answers={getFilteredAnswersWithStep}
                  onAnswerSelect={() => {}}
                  correctAnswers={getFilteredCorrectAnswersWithStep}
                  showResults={true}
                  startIndex={0}
                  actualQuestionNumbers={getFilteredIndices.map(i => i + 1)}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  return null;
};

export default TestBookPanel;
