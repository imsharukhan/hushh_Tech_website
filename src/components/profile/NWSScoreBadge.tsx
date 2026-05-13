/**
 * NWS Score Badge — Circular progress indicator for Network Worth Score
 * Shows score 0–100 with grade and color coding
 */

import { NWSResult, NWSBreakdown } from '../../services/networkScore/calculateNWS';

interface NWSScoreBadgeProps {
  result: NWSResult | null;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

// Color based on grade
const getColor = (grade: string): string => {
  switch (grade) {
    case 'A+': return '#34C759';
    case 'A': return '#30D158';
    case 'B+': return '#007AFF';
    case 'B': return '#5856D6';
    case 'C+': return '#FF9500';
    case 'C': return '#FF9500';
    case 'D': return '#FF3B30';
    default: return '#8E8E93';
  }
};

// Breakdown category labels
const BREAKDOWN_LABELS: Record<keyof NWSBreakdown, { label: string; max: number }> = {
  liquidity: { label: 'Liquidity', max: 20 },
  investments: { label: 'Investments', max: 25 },
  assetDepth: { label: 'Asset Depth', max: 20 },
  diversification: { label: 'Diversification', max: 15 },
  identityConfidence: { label: 'Identity', max: 10 },
  accountHealth: { label: 'Health', max: 10 },
};

const NWSScoreBadge = ({ result, loading = false, size = 'md', showBreakdown = false }: NWSScoreBadgeProps) => {
  // Loading shimmer
  if (loading) {
    const dim = size === 'sm' ? 64 : size === 'md' ? 96 : 128;
    return (
      <div
        className="flex flex-col items-center gap-2"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading Network Worth Score"
      >
        <div aria-hidden="true" className="rounded-full bg-gray-100 animate-pulse" style={{ width: dim, height: dim }} />
        <div aria-hidden="true" className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // No data
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-50">
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-[11px] text-gray-400 font-medium">NWS</span>
        </div>
        <p className="text-[11px] text-gray-400">No data</p>
      </div>
    );
  }

  const { score, grade, label } = result;
  const color = getColor(grade);
  const pct = score / 100;

  // SVG dimensions based on size
  const dim = size === 'sm' ? 64 : size === 'md' ? 96 : 128;
  const strokeWidth = size === 'sm' ? 5 : size === 'md' ? 6 : 8;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular Progress */}
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={dim / 2} cy={dim / 2} r={radius}
            fill="none" stroke="#F2F2F7"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2} cy={dim / 2} r={radius}
            fill="none" stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-black leading-none" style={{ fontSize: dim * 0.28 }}>{score}</span>
          <span className="font-bold leading-none mt-0.5" style={{ fontSize: dim * 0.14, color }}>{grade}</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-[13px] font-semibold text-black">NWS</p>
        <p className="text-[11px]" style={{ color }}>{label}</p>
      </div>

      {/* Breakdown bars (optional) */}
      {showBreakdown && result.breakdown && (
        <div className="w-full max-w-[220px] mt-2 space-y-1.5">
          {(Object.keys(BREAKDOWN_LABELS) as (keyof NWSBreakdown)[]).map((key) => {
            const { label: lbl, max } = BREAKDOWN_LABELS[key];
            const val = result.breakdown[key];
            const barPct = max > 0 ? (val / max) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[#8E8E93] w-[70px] text-right shrink-0">{lbl}</span>
                <div className="flex-1 h-[6px] bg-[#F2F2F7] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barPct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#8E8E93] w-[30px] shrink-0">{val}/{max}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NWSScoreBadge;
