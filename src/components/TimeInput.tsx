import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeInputProps {
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  label?: string;
  className?: string;
}

export const TimeInput = ({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  label,
  className = '',
}: TimeInputProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => onHoursChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="bg-muted/50 border-white/10 text-center"
          />
          <span className="text-xs text-muted-foreground text-center block mt-1">ساعت</span>
        </div>
        <span className="text-xl font-bold text-muted-foreground">:</span>
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => onMinutesChange(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="bg-muted/50 border-white/10 text-center"
          />
          <span className="text-xs text-muted-foreground text-center block mt-1">دقیقه</span>
        </div>
      </div>
    </div>
  );
};
