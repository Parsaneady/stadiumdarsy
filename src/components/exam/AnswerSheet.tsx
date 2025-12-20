import { memo } from 'react';
import { Lock } from 'lucide-react';

interface AnswerSheetProps {
  questionCount: number;
  answers: Record<number, number>; // questionIndex -> selectedOption (1-4)
  onAnswerSelect: (questionIndex: number, option: number) => void;
  lockedQuestions?: Set<number>; // Set of locked question indices
  correctAnswers?: Record<number, number>; // For correction mode
  showResults?: boolean;
}

const options = [1, 2, 3, 4];

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
    
    let baseClass = "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ";
    
    if (isLocked) {
      baseClass += "opacity-50 cursor-not-allowed ";
    }
    
    if (showResults) {
      if (isCorrect) {
        baseClass += "bg-success/20 border-success text-success ";
      } else if (userWrong) {
        baseClass += "bg-destructive/20 border-destructive text-destructive ";
      } else if (isSelected) {
        baseClass += "bg-primary/20 border-primary text-primary ";
      } else {
        baseClass += "border-white/20 hover:border-white/40 ";
      }
    } else {
      if (isSelected) {
        baseClass += "bg-primary border-primary text-primary-foreground ";
      } else {
        baseClass += "border-white/20 hover:border-primary/50 hover:bg-primary/10 ";
      }
    }
    
    return baseClass;
  };

  return (
    <div className="space-y-1 p-2">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-white/10">
        <span>شماره</span>
        <div className="flex gap-4">
          {options.map(opt => (
            <span key={opt} className="w-8 text-center">{opt}</span>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
        {Array.from({ length: questionCount }, (_, i) => {
          const isLocked = lockedQuestions.has(i);
          
          return (
            <div 
              key={i} 
              className={`flex items-center justify-between py-1.5 px-1 rounded ${
                isLocked ? 'bg-white/5' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-6 text-left">{i + 1}</span>
                {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
              </div>
              <div className="flex gap-4">
                {options.map(opt => (
                  <button
                    key={opt}
                    className={getOptionClass(i, opt)}
                    onClick={() => !isLocked && onAnswerSelect(i, opt)}
                    disabled={isLocked}
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
  );
});

AnswerSheet.displayName = 'AnswerSheet';
