"use client";

import { useMemo } from 'react';

export function MetricStrip({
  label,
  value,
  unit,
  series = [],
}: {
  label: string;
  value: string;
  unit?: string;
  series?: number[];
}) {
  const normalized = useMemo(() => {
    if (!series || series.length === 0) return [] as number[];
    const max = Math.max(...series);
    const safeMax = max <= 0 ? 1 : max;
    return series.map((v) => Math.max(2, Math.round((v / safeMax) * 16)));
  }, [series]);

  return (
    <div className="v2-card p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-2xl font-semibold leading-none">{value}</div>
        {unit && <div className="text-xs opacity-70">{unit}</div>}
      </div>
      {normalized.length > 0 && (
        <div className="mt-3 flex items-end gap-[3px] h-16 opacity-90">
          {normalized.map((h, i) => (
            <div key={i} className="w-[6px] rounded-sm bg-primary/70" style={{ height: `${h}px` }} />
          ))}
        </div>
      )}
    </div>
  );
}


