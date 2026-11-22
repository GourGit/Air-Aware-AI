import { useState } from 'react';
import { Route, Navigation, Car, Bike, Train, Bus, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mobilityService } from '@/services/features';

export default function MobilityPage() {
  const [origin, setOrigin] = useState('Anand Vihar');
  const [destination, setDestination] = useState('Connaught Place');
  const [distanceKm, setDistanceKm] = useState(15.0);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await mobilityService.compare(distanceKm, origin, destination);
      setComparison(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="pb-4 border-b border-border dark:border-forest/30">
          <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
            <Route className="w-3.5 h-3.5" />
            <span>Sustainable Urban Transportation</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
            Transit Emissions & Exposure Comparison
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Deterministic greenhouse gas (CO2e) emissions modeling based on Indian ARAI & CEA vehicle baselines.
          </p>
        </div>

        {/* Input Parameters Form */}
        <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Origin Location</label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Anand Vihar" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Destination</label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Connaught Place" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase mb-1">Estimated Distance (km)</label>
              <Input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
          </div>

          <Button onClick={handleCompare} disabled={loading} className="w-full bg-mint hover:bg-mint/90 text-white font-semibold">
            {loading ? 'Calculating ARAI Emission Baselines...' : 'Compare Transport Modes & Emissions'}
          </Button>
        </div>

        {/* Mode Comparison Results Table */}
        {comparison && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-mint/10 border border-mint/20 text-xs text-charcoal dark:text-mist flex items-center justify-between">
              <span>{comparison.recommendation}</span>
              <span className="text-[10px] text-slate font-mono">{comparison.emission_factors_source}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparison.comparisons.map((c: any) => (
                <div
                  key={c.mode}
                  className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-charcoal dark:text-white">{c.mode_name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        c.health_exposure_rating === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {c.health_exposure_rating} Exposure
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-extrabold font-display text-charcoal dark:text-white">
                      {c.co2e_emissions_kg} <span className="text-xs text-slate font-normal">kg CO2e</span>
                    </div>
                    {c.co2e_saved_vs_car_kg > 0 && (
                      <p className="text-xs text-mint font-semibold">
                        Saves {c.co2e_saved_vs_car_kg} kg vs petrol car
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/80 dark:border-forest/30 flex justify-between text-xs text-slate">
                    <span>Est. Time: <strong>{c.travel_time_est_mins} mins</strong></span>
                    {c.caloric_burn_kcal > 0 && <span>Burn: {c.caloric_burn_kcal} kcal</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
