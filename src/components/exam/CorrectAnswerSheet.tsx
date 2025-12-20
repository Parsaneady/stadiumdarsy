import { memo } from 'react';
import { Check } from 'lucide-react';

interface CorrectAnswerSheetProps {
  questionCount: number;
  correctAnswers: Record<number, number>;
  onCorrectAnswerSelect: (questionIndex: number, option: number) => void;
}

const options = [1, 2, 3, 4];
const optionLabels = ['الف', 'ب', 'ج', 'د'];

export const CorrectAnswerSheet = memo(({ 
  questionCount, 
  correctAnswers, 
  onCorrectAnswerSelect
}: CorrectAnswerSheetProps) => {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="py-3 px-4 border-b border-white/10 bg-success/10 sticky top-0 z-10">
        <div className="text-center text-sm font-semibold text-success flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          پاسخنامه صحیح
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between text-xs text-muted-foreground py-3 px-4 border-b border-white/10 bg-white/5">
        <span className="w-8">سوال</span>
        <div className="flex gap-3">
          {options.map((opt, idx) => (
            <span key={opt} className="w-10 text-center font-medium">
              {optionLabels[idx]}
            </span>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Array.from({ length: questionCount }, (_, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
              correctAnswers[i] ? 'bg-success/5' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-success">{i + 1}</span>
            </div>
            <div className="flex gap-3">
              {options.map((opt, idx) => (
                <button
                  key={opt}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 ${
                    correctAnswers[i] === opt
                      ? 'bg-success border-success text-success-foreground shadow-lg shadow-success/40'
                      : 'border-white/20 text-foreground/70 hover:border-success/50 hover:bg-success/10 hover:text-success'
                  }`}
                  onClick={() => onCorrectAnswerSelect(i, opt)}
                  title={optionLabels[idx]}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-around py-3 px-4 border-t border-white/10 bg-white/5 text-xs">
        <div className="text-center">
          <div className="text-lg font-bold text-success">{Object.keys(correctAnswers).length}</div>
          <div className="text-muted-foreground">وارد شده</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="text-lg font-bold text-muted-foreground">{questionCount - Object.keys(correctAnswers).length}</div>
          <div className="text-muted-foreground">باقیمانده</div>
        </div>
      </div>
    </div>
  );
});

CorrectAnswerSheet.displayName = 'CorrectAnswerSheet';
