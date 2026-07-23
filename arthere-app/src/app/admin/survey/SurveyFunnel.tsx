"use client";

export type FunnelStep = {
  label: string;
  count: number;
  artistOnly?: boolean;
};

export default function SurveyFunnel({
  steps,
  artistSteps,
  total,
}: {
  steps: FunnelStep[];
  artistSteps: FunnelStep[];
  total: number;
}) {
  const maxCount = steps[0]?.count ?? 1;

  return (
    <div className="mb-10">
      <h2 className="font-medium mb-4 text-[#888] text-sm uppercase tracking-wide">Drop-off Funnel</h2>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Main funnel */}
        <div className="md:col-span-2 bg-white border border-[#e5e5e5] rounded-xl p-5">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="font-medium text-sm">All respondents</h3>
            <span className="text-xs text-[#bbb]">{total} started</span>
          </div>
          <div className="space-y-1">
            {steps.map((step, i) => {
              const prev = i === 0 ? total : steps[i - 1].count;
              const dropped = prev - step.count;
              const dropPct = prev > 0 ? Math.round((dropped / prev) * 100) : 0;
              const barPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              const reachPct = total > 0 ? Math.round((step.count / total) * 100) : 0;

              return (
                <div key={step.label}>
                  {/* Drop-off indicator */}
                  {i > 0 && dropped > 0 && (
                    <div className="flex items-center gap-2 py-0.5 pl-1">
                      <span className="text-[10px] text-red-400">↓ {dropped} left ({dropPct}%)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-xs text-[#444]">{step.label}</span>
                        <span className="text-xs text-[#999] ml-2 flex-shrink-0">
                          {step.count} <span className="text-[#ccc]">({reachPct}%)</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: i === steps.length - 1 ? "#22c55e" : "#1a1a1a",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Artist-only branch */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="font-medium text-sm">Artist branch</h3>
          </div>
          <p className="text-xs text-[#bbb] mb-4">Shown only to practicing artists</p>
          <div className="space-y-1">
            {artistSteps.map((step, i) => {
              const prev = i === 0 ? null : artistSteps[i - 1].count;
              const dropped = prev != null ? prev - step.count : 0;
              const dropPct = prev != null && prev > 0 ? Math.round((dropped / prev) * 100) : 0;
              const base = artistSteps[0]?.count ?? 1;
              const barPct = base > 0 ? (step.count / base) * 100 : 0;
              const basePct = base > 0 ? Math.round((step.count / base) * 100) : 0;

              return (
                <div key={step.label}>
                  {i > 0 && dropped > 0 && (
                    <div className="flex items-center gap-2 py-0.5 pl-1">
                      <span className="text-[10px] text-red-400">↓ {dropped} left ({dropPct}%)</span>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-xs text-[#444]">{step.label}</span>
                      <span className="text-xs text-[#999] ml-2 flex-shrink-0">
                        {step.count} <span className="text-[#ccc]">({basePct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
