interface OccupancyBarProps {
  percent: number;
  label?: string;
}

export function OccupancyBar({ percent, label }: OccupancyBarProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const tone =
    clamped >= 90 ? "bg-destructive" : clamped >= 85 ? "bg-warning" : "bg-accent";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label ?? "Aforo ocupado"}</span>
        <span className="font-medium text-foreground">{clamped}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
