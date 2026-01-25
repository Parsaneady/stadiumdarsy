import { useState, useEffect, useCallback } from 'react';
import { Book, Plus, Trash2, Check, ArrowLeft, Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnswerSheet } from '@/components/exam/AnswerSheet';
import { CorrectAnswerSheet } from '@/components/exam/CorrectAnswerSheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TestBook {
  id: string;
  name: string;
  total_questions: number;
  answers: Record<number, number>;
  correct_answers: Record<number, number>;
  created_at: string;
}

type ViewMode = 'list' | 'answers' | 'correction' | 'results';

export const TestBookAnswerSheet = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<TestBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<TestBook | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookQuestions, setNewBookQuestions] = useState(100);
  const [loading, setLoading] = useState(true);

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
        })
        .select()
        .single();

      if (error) throw error;

      const newBook: TestBook = {
        ...data,
        answers: {},
        correct_answers: {},
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

  // Handle answer select
  const handleAnswerSelect = (questionIndex: number, option: number) => {
    if (!selectedBook) return;
    
    const newAnswers = { ...selectedBook.answers };
    if (newAnswers[questionIndex] === option) {
      delete newAnswers[questionIndex];
    } else {
      newAnswers[questionIndex] = option;
    }
    
    saveAnswers(selectedBook, newAnswers);
  };

  // Handle correct answer select
  const handleCorrectAnswerSelect = (questionIndex: number, option: number) => {
    if (!selectedBook) return;
    
    const newCorrectAnswers = { ...selectedBook.correct_answers };
    if (newCorrectAnswers[questionIndex] === option) {
      delete newCorrectAnswers[questionIndex];
    } else {
      newCorrectAnswers[questionIndex] = option;
    }
    
    saveCorrectAnswers(selectedBook, newCorrectAnswers);
  };

  // Calculate stats
  const calculateStats = (book: TestBook) => {
    const answeredCount = Object.keys(book.answers).length;
    const correctCount = Object.keys(book.correct_answers).length;
    
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    
    if (correctCount > 0) {
      for (let i = 0; i < book.total_questions; i++) {
        if (book.answers[i] === undefined) {
          blank++;
        } else if (book.answers[i] === book.correct_answers[i]) {
          correct++;
        } else if (book.correct_answers[i] !== undefined) {
          wrong++;
        }
      }
    }
    
    // Konkur scoring: correct - (wrong / 3)
    const score = correct - (wrong / 3);
    const percentage = correctCount > 0 ? (score / correctCount) * 100 : 0;
    
    return { answeredCount, correctCount, correct, wrong, blank, percentage };
  };

  // Back to list
  const handleBack = () => {
    setSelectedBook(null);
    setViewMode('list');
  };

  // Render book list
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            کتاب‌های تست
          </h3>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            کتاب جدید
          </Button>
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
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
          <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز کتاب تستی اضافه نکرده‌اید
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {books.map(book => {
              const stats = calculateStats(book);
              const hasCorrectAnswers = stats.correctCount > 0;
              
              return (
                <div
                  key={book.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{book.name}</h4>
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
                  <div className="w-full h-2 rounded-full bg-white/10 mb-3">
                    <div 
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(stats.answeredCount / book.total_questions) * 100}%` }}
                    />
                  </div>
                  
                  {/* Stats if has correct answers */}
                  {hasCorrectAnswers && (
                    <div className="flex gap-4 text-sm mb-3">
                      <span className="text-success">✓ {stats.correct} صحیح</span>
                      <span className="text-destructive">✗ {stats.wrong} غلط</span>
                      <span className="text-muted-foreground">○ {stats.blank} نزده</span>
                      <span className={stats.percentage >= 0 ? 'text-success' : 'text-destructive'}>
                        {stats.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
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
    );
  }

  // Render answer sheet view
  if (viewMode === 'answers' && selectedBook) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-bold">{selectedBook.name}</h3>
            <p className="text-sm text-muted-foreground">پاسخ‌برگ خام</p>
          </div>
        </div>
        <div className="h-[500px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <AnswerSheet
            questionCount={selectedBook.total_questions}
            answers={selectedBook.answers}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>
      </div>
    );
  }

  // Render correction view
  if (viewMode === 'correction' && selectedBook) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-bold">{selectedBook.name}</h3>
            <p className="text-sm text-muted-foreground">وارد کردن کلید پاسخ</p>
          </div>
        </div>
        <div className="h-[500px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <CorrectAnswerSheet
            questionCount={selectedBook.total_questions}
            correctAnswers={selectedBook.correct_answers}
            onCorrectAnswerSelect={handleCorrectAnswerSelect}
          />
        </div>
      </div>
    );
  }

  // Render results view
  if (viewMode === 'results' && selectedBook) {
    const stats = calculateStats(selectedBook);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="font-bold">{selectedBook.name}</h3>
            <p className="text-sm text-muted-foreground">عملکرد</p>
          </div>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-success/20 border border-success/30 text-center">
            <div className="text-2xl font-bold text-success">{stats.correct}</div>
            <div className="text-sm text-muted-foreground">صحیح</div>
          </div>
          <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/30 text-center">
            <div className="text-2xl font-bold text-destructive">{stats.wrong}</div>
            <div className="text-sm text-muted-foreground">غلط</div>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.blank}</div>
            <div className="text-sm text-muted-foreground">نزده</div>
          </div>
          <div className={`p-4 rounded-xl border text-center ${
            stats.percentage >= 0 
              ? 'bg-success/20 border-success/30' 
              : 'bg-destructive/20 border-destructive/30'
          }`}>
            <div className={`text-2xl font-bold ${
              stats.percentage >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {stats.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">درصد</div>
          </div>
        </div>
        
        {/* Answer sheet with results */}
        <div className="h-[400px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <AnswerSheet
            questionCount={selectedBook.total_questions}
            answers={selectedBook.answers}
            onAnswerSelect={() => {}}
            correctAnswers={selectedBook.correct_answers}
            showResults={true}
          />
        </div>
      </div>
    );
  }

  return null;
};
