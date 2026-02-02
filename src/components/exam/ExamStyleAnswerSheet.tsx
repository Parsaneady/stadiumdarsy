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
  actualQuestionNumbers?: number[];
}

const options = [1, 2, 3, 4]; // RTL order: 1 on right, 4 on left

export const ExamStyleAnswerSheet = memo(({
  questionCount,
  answers,
  onAnswerSelect,
  correctAnswers,
  showResults = false,
  startIndex = 0,
  markedQuestions = new Set(),
  onToggleMark,
  showMarkOption = false,
  actualQuestionNumbers
}: ExamStyleAnswerSheetProps) => {
  const getOptionClass = (qIndex: number, option: number) => {
    const isSelected = answers[qIndex] === option;
    const isCorrect = correctAnswers && correctAnswers[qIndex] === option;
    const userWrong = showResults && isSelected && correctAnswers && correctAnswers[qIndex] !== option;

    let classes = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer ";

    if (showResults) {
      if (isCorrect) {
        classes += "bg-success text-success-foreground ";
      } else if (userWrong) {
        classes += "bg-destructive text-destructive-foreground ";
      } else if (isSelected) {
        classes += "bg-muted text-muted-foreground ";
      } else {
        classes += "bg-slate-600 text-slate-400 ";
      }
    } else {
      if (isSelected) {
        classes += "bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 ";
      } else {
        classes += "bg-slate-600 text-slate-300 hover:bg-slate-500 ";
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

  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] !== undefined).length;
  const unansweredCount = questionCount - answeredCount;
  const progressPercent = Math.round((answeredCount / questionCount) * 100);

  return (
    <div className="h-full overflow-hidden flex flex-col" dir="rtl">
      {/* Header */}
      <div className="py-4 px-6 border-b border-white/10 sticky top-0 z-10">
        <div className="text-center text-lg font-bold text-cyan-400">
          پاسخنامه
        </div>
      </div>

      {/* Questions Grid - 5 columns RTL */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: questionCount }, (_, i) => {
            const status = getQuestionStatus(i);
            // Use actualQuestionNumbers if provided, otherwise fallback to startIndex
            const actualQuestionNumber = actualQuestionNumbers 
              ? actualQuestionNumbers[i] 
              : startIndex + i + 1;
            const isMarked = markedQuestions.has(i);
            const isAnswered = answers[i] !== undefined;
            
            return (
              <div
                key={i}
                className={`p-4 rounded-2xl transition-all duration-200 ${
                  isMarked 
                    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background shadow-lg shadow-yellow-400/30' 
                    : ''
                } ${
                  status === 'correct' ? 'bg-success/20' 
                  : status === 'wrong' ? 'bg-destructive/20' 
                  : status === 'blank' ? 'bg-slate-800/60' 
                  : isAnswered && !showResults ? 'bg-slate-700/95 shadow-md'
                  : 'bg-slate-800/90'
                }`}
              >
                {/* Question header with mark and number */}
                <div className="flex items-center justify-between mb-3">
                  {/* Mark button on left */}
                  {showMarkOption && onToggleMark && !showResults ? (
                    <button
                      onClick={() => onToggleMark(i)}
                      className={`p-1 transition-all duration-200 ${
                        isMarked 
                          ? 'text-yellow-400' 
                          : 'text-slate-500 hover:text-yellow-400'
                      }`}
                      title={isMarked ? 'حذف علامت' : 'علامت‌گذاری'}
                    >
                      <Star className={`w-5 h-5 ${isMarked ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}
                  
                  {/* Question number and status on right */}
                  <div className="flex items-center gap-2">
                    {status === 'correct' && <Check className="w-4 h-4 text-success" />}
                    {status === 'wrong' && <X className="w-4 h-4 text-destructive" />}
                    <span className="text-base font-bold text-white">
                      سوال {actualQuestionNumber}
                    </span>
                  </div>
                </div>
                
                {/* Options row - 4 3 2 1 from left to right */}
                <div className="flex gap-2 justify-center">
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
      <div className="grid grid-cols-3">
        <div className="py-4 px-4 text-center bg-teal-600/90">
          <div className="text-2xl font-bold text-white">
            {progressPercent}%
          </div>
          <div className="text-sm text-white/80">پیشرفت</div>
        </div>
        <div className="py-4 px-4 text-center bg-cyan-700/90">
          <div className="text-2xl font-bold text-white">
            {unansweredCount}
          </div>
          <div className="text-sm text-white/80">بدون پاسخ</div>
        </div>
        <div className="py-4 px-4 text-center bg-slate-700/90">
          <div className="text-2xl font-bold text-white">
            {answeredCount}
          </div>
          <div className="text-sm text-white/80">پاسخ داده شده</div>
        </div>
      </div>
    </div>
  );
});

ExamStyleAnswerSheet.displayName = 'ExamStyleAnswerSheet';
