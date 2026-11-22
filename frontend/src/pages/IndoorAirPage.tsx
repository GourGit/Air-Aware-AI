import { useState, useEffect } from 'react';
import { Home, Wind, ShieldAlert, CheckSquare, Sparkles, Filter, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { indoorService } from '@/services/features';

export default function IndoorAirPage() {
  const [guidance, setGuidance] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  // Assessment form state
  const [hasPurifier, setHasPurifier] = useState(true);
  const [filterAge, setFilterAge] = useState(4);
  const [cookingFuel, setCookingFuel] = useState('lpg');
  const [hasSmokers, setHasSmokers] = useState(false);

  useEffect(() => {
    indoorService.getGuidance().then(setGuidance);
    indoorService.getChecklists().then(setChecklists);
  }, []);

  const handleRunAssessment = async () => {
    const res = await indoorService.submitAssessment({
      has_air_purifier: hasPurifier,
      purifier_filter_age_months: filterAge,
      cooking_fuel_type: cookingFuel,
      has_smokers: hasSmokers,
    });
    setAssessmentResult(res);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="pb-4 border-b border-border dark:border-forest/30">
          <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
            <Home className="w-3.5 h-3.5" />
            <span>Indoor Environmental Health</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
            Indoor Air Quality & Filtration Advisor
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Practical guidelines on natural ventilation, HEPA filtration, and household particulate mitigation.
          </p>
        </div>

        {/* Live Ventilation Status Banner */}
        {guidance && (
          <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint font-bold">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate uppercase">Ventilation Status</span>
                  <h3 className="text-lg font-bold font-display text-charcoal dark:text-white">
                    {guidance.ventilation_status} Natural Air Exchange
                  </h3>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-muted dark:bg-forest/20 text-charcoal dark:text-mist">
                Outdoor AQI: {guidance.outdoor_aqi_comparison?.outdoor_aqi}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 dark:bg-forest/10 border border-border/80 dark:border-forest/30">
                <strong className="text-xs uppercase text-slate font-bold block mb-1">Window Ventilation</strong>
                <p className="text-xs text-charcoal dark:text-mist leading-relaxed">{guidance.ventilation_advice}</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 dark:bg-forest/10 border border-border/80 dark:border-forest/30">
                <strong className="text-xs uppercase text-slate font-bold block mb-1">Air Purifier Operation</strong>
                <p className="text-xs text-charcoal dark:text-mist leading-relaxed">{guidance.air_purifier_guidance}</p>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 dark:bg-forest/10 border border-border/80 dark:border-forest/30">
                <strong className="text-xs uppercase text-slate font-bold block mb-1">Cooking & Dust Control</strong>
                <p className="text-xs text-charcoal dark:text-mist leading-relaxed">{guidance.cooking_advice}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Household Air Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-charcoal dark:text-white">
              Household Air Hygiene Assessment
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate text-xs font-semibold">HEPA Air Purifier at Home</span>
                <input
                  type="checkbox"
                  checked={hasPurifier}
                  onChange={(e) => setHasPurifier(e.target.checked)}
                  className="w-4 h-4 accent-mint rounded cursor-pointer"
                />
              </div>

              {hasPurifier && (
                <div>
                  <label className="block text-xs font-semibold text-slate mb-1">
                    Filter Age (Months): <strong className="text-mint">{filterAge} mo</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={filterAge}
                    onChange={(e) => setFilterAge(Number(e.target.value))}
                    className="w-full accent-mint"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate mb-1">Primary Cooking Fuel</label>
                <select
                  value={cookingFuel}
                  onChange={(e) => setCookingFuel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border dark:border-forest/40 bg-white dark:bg-charcoal text-xs text-charcoal dark:text-white"
                >
                  <option value="lpg">LPG / Piped Natural Gas / Induction (Clean)</option>
                  <option value="biomass">Biomass / Charcoal / Firewood (High Risk)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-slate text-xs font-semibold">Any indoor smoking?</span>
                <input
                  type="checkbox"
                  checked={hasSmokers}
                  onChange={(e) => setHasSmokers(e.target.checked)}
                  className="w-4 h-4 accent-mint rounded cursor-pointer"
                />
              </div>

              <Button onClick={handleRunAssessment} className="w-full bg-mint hover:bg-mint/90 text-white text-xs mt-2">
                Calculate Indoor Air Score
              </Button>
            </div>
          </div>

          {/* Assessment Score / Result */}
          <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm flex flex-col justify-between">
            {assessmentResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate">Air Hygiene Score</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-mint/10 text-mint">
                    Risk: {assessmentResult.risk_level}
                  </span>
                </div>

                <div className="text-5xl font-extrabold font-display text-mint">
                  {assessmentResult.overall_indoor_score} / 100
                </div>

                <div className="space-y-2 text-xs">
                  {assessmentResult.strengths.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                      <span>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                  {assessmentResult.vulnerabilities.map((v: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <span>⚠</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate/50" />
                <p className="text-xs">Adjust your household context and calculate your indoor air hygiene score.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
