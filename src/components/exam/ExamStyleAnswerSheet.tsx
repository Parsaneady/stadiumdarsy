import { memo } from 'react';
import { Check, X } from 'lucide-react';

interface ExamStyleAnswerSheetProps {
  questionCount: number;
  answers: Record<number, number>;
  onAnswerSelect: (questionIndex: number, option: number) => void;
  correctAnswers?: Record<number, number>;
  showResults?: boolean;
  startIndex?: number; // برای نمایش شماره واقعی سوال
}

const options = [1, 2, 3, 4];

export const ExamStyleAnswerSheet = memo(({
  questionCount,
  answers,
  onAnswerSelect,
  correctAnswers,
  showResults = false,
  startIndex = 0
}: ExamStyleAnswerSheetProps) => {
  const getOptionClass = (qIndex: number, option: number) => {
    const isSelected = answers[qIndex] === option;
    const isCorrect = correctAnswers && correctAnswers[qIndex] === option;
    const userWrong = showResults && isSelected && correctAnswers && correctAnswers[qIndex] !== option;

    let classes = "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer ";

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
      <div className="py-3 px-4 border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <div className="text-center text-sm font-semibold text-primary">
          پاسخنامه
        </div>
      </div>

      {/* Questions Grid - 5 columns RTL */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: questionCount }, (_, i) => {
            const status = getQuestionStatus(i);
            const actualQuestionNumber = startIndex + i + 1;
            
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border transition-colors ${
                  status === 'correct' ? 'bg-success/10 border-success/30' :
                  status === 'wrong' ? 'bg-destructive/10 border-destructive/30' :
                  status === 'blank' ? 'bg-muted/10 border-muted/30' :
                  answers[i] ? 'bg-primary/5 border-primary/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                {/* Question number with status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">
                    سوال {actualQuestionNumber}
                  </span>
                  {status === 'correct' && <Check className="w-4 h-4 text-success" />}
                  {status === 'wrong' && <X className="w-4 h-4 text-destructive" />}
                </div>
                
                {/* Options row */}
                <div className="flex gap-1.5 justify-start">
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
        <div className="py-3 px-4 text-center border-l border-white/10">
          <div className="text-lg font-bold text-primary">
            {Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length}
          </div>
          <div className="text-xs text-muted-foreground">پاسخ داده شده</div>
        </div>
        <div className="py-3 px-4 text-center border-l border-white/10">
          <div className="text-lg font-bold text-muted-foreground">
            {questionCount - Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length}
          </div>
          <div className="text-xs text-muted-foreground">بدون پاسخ</div>
        </div>
        <div className="py-3 px-4 text-center">
          <div className="text-lg font-bold text-success">
            {Math.round((Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length / questionCount) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">پیشرفت</div>
        </div>
      </div>
    </div>
  );
});

ExamStyleAnswerSheet.displayName = 'ExamStyleAnswerSheet';
