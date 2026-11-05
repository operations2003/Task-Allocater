import React from 'react';

const TONES = {
  neutral: { value: 'text-foreground', bar: 'bg-white/25', chip: 'text-muted-foreground' },
  signal: { value: 'text-signal', bar: 'bg-signal/70', chip: 'text-signal/80' },
  danger: { value: 'text-danger', bar: 'bg-danger/70', chip: 'text-danger/80' },
  ok: { value: 'text-ok', bar: 'bg-ok/70', chip: 'text-ok/80' },
  warn: { value: 'text-warn', bar: 'bg-warn/70', chip: 'text-warn/80' },
};

export const SparkCard = ({
  label,
  value,
  delta,
  tone = 'neutral',
  bars = [],
  className = '',
}) => {
  const t = TONES[tone] || TONES.neutral;
  const max = Math.max(...bars, 1);

  return (
    <div
      className={`panel group relative overflow-hidden p-5 transition-colors duration-300 hover:border-white/[0.12] ${className}`}
    >
      <p className="eyebrow">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`num text-[34px] leading-none tracking-tight font-medium ${t.value}`}>
          {value}
        </p>
        <div className="flex h-9 items-end gap-[3px]">
          {bars.map((barVal, idx) => {
            const heightPct = Math.max(12, (barVal / max) * 100);
            const opacity = 0.35 + (idx / Math.max(bars.length, 1)) * 0.65;
            return (
              <span
                key={idx}
                className={`w-[3px] rounded-full transition-all duration-500 ${t.bar}`}
                style={{ height: `${heightPct}%`, opacity }}
              />
            );
          })}
        </div>
      </div>
      {delta && (
        <p className="mt-3 text-[11px] text-muted-foreground transition group-hover:text-foreground/80">
          {delta}
        </p>
      )}
    </div>
  );
};
