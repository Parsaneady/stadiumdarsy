import { memo } from 'react';
import { Lock, Check, X } from 'lucide-react';

interface AnswerSheetProps {
  questionCount: number;
  answers: Record<number, number>;
  onAnswerSelect: (questionIndex: number, option: number) => void;
  lockedQuestions?: Set<number>;
  correctAnswers?: Record<number, number>;
  showResults?: boolean;
}

const options = [1, 2, 3, 4];
const optionLabels = ['الف', 'ب', 'ج', 'د'];

export const AnswerSheet = memo(({ 
  questionCount, 
  answers, 
  onAnswerSelect,
  lockedQuestions = new Set(),
  correctAnswers,
  showResults = false
}: AnswerSheetProps) => {
  const getOptionClass = (qIndex: number, option: number) => {
    const isSelected = answers[qIndex] === option;
    const isLocked = lockedQuestions.has(qIndex);
    const isCorrect = correctAnswers && correctAnswers[qIndex] === option;
    const userWrong = showResults && isSelected && correctAnswers && correctAnswers[qIndex] !== option;
    
    let classes = "w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 ";
    
    if (isLocked) {
      classes += "opacity-40 cursor-not-allowed ";
    } else {
      classes += "cursor-pointer transform hover:scale-105 active:scale-95 ";
    }
    
    if (showResults) {
      if (isCorrect) {
        classes += "bg-success border-success text-success-foreground shadow-lg shadow-success/30 ";
      } else if (userWrong) {
        classes += "bg-destructive border-destructive text-destructive-foreground shadow-lg shadow-destructive/30 ";
      } else if (isSelected) {
        classes += "bg-muted border-muted-foreground/30 text-muted-foreground ";
      } else {
        classes += "border-white/10 text-muted-foreground/50 ";
      }
    } else {
      if (isSelected) {
        classes += "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/40 ";
      } else {
        classes += "border-white/20 text-foreground/70 hover:border-primary/50 hover:bg-primary/10 hover:text-primary ";
      }
    }
    
    return classes;
  };

  const getRowClass = (qIndex: number) => {
    const isLocked = lockedQuestions.has(qIndex);
    const hasAnswer = answers[qIndex] !== undefined;
    
    let classes = "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ";
    
    if (isLocked) {
      classes += "bg-muted/20 ";
    } else if (hasAnswer) {
      classes += "bg-primary/5 ";
    } else {
      classes += "hover:bg-white/5 ";
    }
    
    return classes;
  };

  const getResultIcon = (qIndex: number) => {
    if (!showResults || !correctAnswers) return null;
    
    const userAnswer = answers[qIndex];
    const correct = correctAnswers[qIndex];
    
    if (!userAnswer) {
      return <span className="text-xs text-muted-foreground">نزده</span>;
    }
    if (userAnswer === correct) {
      return <Check className="w-4 h-4 text-success" />;
    }
    return <X className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground py-3 px-4 border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <span className="w-8">سوال</span>
          {showResults && <span className="w-10 text-center">نتیجه</span>}
        </div>
        <div className="flex gap-3">
          {options.map((opt, idx) => (
            <span key={opt} className="w-10 text-center font-medium">
              {optionLabels[idx]}
            </span>
          ))}
        </div>
      </div>

      {/* Questions Grid */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Array.from({ length: questionCount }, (_, i) => {
          const isLocked = lockedQuestions.has(i);
          
          return (
            <div key={i} className={getRowClass(i)}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>
                {isLocked && <Lock className="w-4 h-4 text-warning" />}
                {showResults && (
                  <div className="w-10 flex justify-center">
                    {getResultIcon(i)}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {options.map((opt, idx) => (
                  <button
                    key={opt}
                    className={getOptionClass(i, opt)}
                    onClick={() => !isLocked && onAnswerSelect(i, opt)}
                    disabled={isLocked}
                    title={optionLabels[idx]}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-around py-3 px-4 border-t border-white/10 bg-white/5 text-xs">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{Object.keys(answers).length}</div>
          <div className="text-muted-foreground">پاسخ داده</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-bold text-muted-foreground">{questionCount - Object.keys(answers).length}</div>
          <div className="text-muted-foreground">نزده</div>
        </div>
        {lockedQuestions.size > 0 && (
          <>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-lg font-bold text-warning">{lockedQuestions.size}</div>
              <div className="text-muted-foreground">قفل شده</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AnswerSheet.displayName = 'AnswerSheet';
