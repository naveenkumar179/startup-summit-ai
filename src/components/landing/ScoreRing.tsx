interface ScoreRingProps {
  score: number;
  size?: number;
  stroke?: number;
}

export function ScoreRing({ score, size = 140, stroke = 10 }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.93 0.01 275)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.62 0.16 155)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-foreground leading-none">{score}</span>
        <span className="text-xs text-muted-foreground mt-1">/100</span>
      </div>
    </div>
  );
}
