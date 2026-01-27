import { memo } from 'react';
import { Check, X, Star } from 'lucide-react';

interface ExamStyleAnswerSheetProps {
  questionCount: number;
  answers: Record<number, number>;
  onAnswerSelect: (questionIndex: number, option: number) => void;
  correctAnswers?: Record<number, number>;
  showResults?: boolean;
  startIndex?: number;
  markedQuestions?: Set<number>;
  onToggleMark?: (questionIndex: number) => void;
  showMarkOption?: boolean;
}

const options = [1, 2, 3, 4];

export const ExamStyleAnswerSheet = memo(({
  questionCount,
  answers,
  onAnswerSelect,
  correctAnswers,
  showResults = false,
  startIndex = 0,
  markedQuestions = new Set(),
  onToggleMark,
  showMarkOption = false
}: ExamStyleAnswerSheetProps) => {
  const getOptionClass = (qIndex: number, option: number) => {
    const isSelected = answers[qIndex] === option;
    const isCorrect = correctAnswers && correctAnswers[qIndex] === option;
    const userWrong = showResults && isSelected && correctAnswers && correctAnswers[qIndex] !== option;

    let classes = "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer ";

    if (showResults) {
      if (isCorrect) {
        classes += "bg-success text-success-foreground ";
      } else if (userWrong) {
        classes += "bg-destructive text-destructive-foreground ";
      } else if (isSelected) {
        classes += "bg-muted text-muted-foreground ";
      } else {
        classes += "bg-white/10 text-muted-foreground hover:bg-white/20 ";
      }
    } else {
      if (isSelected) {
        classes += "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ";
      } else {
        classes += "bg-white/10 text-foreground/70 hover:bg-primary/20 hover:text-primary ";
      }
    }

    return classes;
  };

  const getQuestionStatus = (qIndex: number) => {
    if (!showResults || !correctAnswers) return null;
    
    const userAnswer = answers[qIndex];
    const correct = correctAnswers[qIndex];
    
    if (!userAnswer && !correct) return null;
    if (!userAnswer) return 'blank';
    if (userAnswer === correct) return 'correct';
    return 'wrong';
  };

  return (
    <div className="h-full overflow-hidden flex flex-col" dir="rtl">
      {/* Header */}
      <div className="py-4 px-6 border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <div className="text-center text-base font-semibold text-primary">
          پاسخنامه
        </div>
      </div>

      {/* Questions Grid - 5 columns RTL */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: questionCount }, (_, i) => {
            const status = getQuestionStatus(i);
            const actualQuestionNumber = startIndex + i + 1;
            const isMarked = markedQuestions.has(i);
            
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isMarked 
                    ? 'ring-2 ring-yellow-400/60 ring-offset-2 ring-offset-background border-yellow-400/50 bg-yellow-400/5 shadow-lg shadow-yellow-400/20' 
                    : status === 'correct' ? 'bg-success/10 border-success/30' 
                    : status === 'wrong' ? 'bg-destructive/10 border-destructive/30' 
                    : status === 'blank' ? 'bg-muted/10 border-muted/30' 
                    : answers[i] ? 'bg-primary/5 border-primary/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Question number with status and mark button */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-foreground">
                    سوال {actualQuestionNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    {showMarkOption && onToggleMark && !showResults && (
                      <button
                        onClick={() => onToggleMark(i)}
                        className={`p-1 rounded-lg transition-all duration-200 ${
                          isMarked 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-muted-foreground/50 hover:text-yellow-400'
                        }`}
                        title={isMarked ? 'حذف علامت' : 'علامت‌گذاری'}
                      >
                        <Star className={`w-4 h-4 ${isMarked ? 'fill-yellow-400' : ''}`} />
                      </button>
                    )}
                    {status === 'correct' && <Check className="w-5 h-5 text-success" />}
                    {status === 'wrong' && <X className="w-5 h-5 text-destructive" />}
                  </div>
                </div>
                
                {/* Options row */}
                <div className="flex gap-2 justify-start">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      className={getOptionClass(i, opt)}
                      onClick={() => !showResults && onAnswerSelect(i, opt)}
                      disabled={showResults}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 border-t border-white/10 bg-white/5">
        <div className="py-4 px-6 text-center border-l border-white/10">
          <div className="text-xl font-bold text-primary">
            {Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length}
          </div>
          <div className="text-sm text-muted-foreground">پاسخ داده شده</div>
        </div>
        <div className="py-4 px-6 text-center border-l border-white/10">
          <div className="text-xl font-bold text-muted-foreground">
            {questionCount - Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length}
          </div>
          <div className="text-sm text-muted-foreground">بدون پاسخ</div>
        </div>
        <div className="py-4 px-6 text-center">
          <div className="text-xl font-bold text-success">
            {Math.round((Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length / questionCount) * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">پیشرفت</div>
        </div>
      </div>
    </div>
  );
});

ExamStyleAnswerSheet.displayName = 'ExamStyleAnswerSheet';
