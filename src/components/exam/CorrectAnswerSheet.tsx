import { memo } from 'react';

interface CorrectAnswerSheetProps {
  questionCount: number;
  correctAnswers: Record<number, number>;
  onCorrectAnswerSelect: (questionIndex: number, option: number) => void;
}

const options = [1, 2, 3, 4];

export const CorrectAnswerSheet = memo(({ 
  questionCount, 
  correctAnswers, 
  onCorrectAnswerSelect
}: CorrectAnswerSheetProps) => {
  return (
    <div className="space-y-1 p-2">
      <div className="text-center text-sm font-medium text-primary mb-3">
        پاسخنامه صحیح را وارد کنید
      </div>

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
      <div className="space-y-1 max-h-[calc(100vh-350px)] overflow-y-auto">
        {Array.from({ length: questionCount }, (_, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-1">
            <span className="text-sm font-medium w-6 text-left">{i + 1}</span>
            <div className="flex gap-4">
              {options.map(opt => (
                <button
                  key={opt}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    correctAnswers[i] === opt
                      ? 'bg-success border-success text-success-foreground'
                      : 'border-white/20 hover:border-success/50 hover:bg-success/10'
                  }`}
                  onClick={() => onCorrectAnswerSelect(i, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CorrectAnswerSheet.displayName = 'CorrectAnswerSheet';
