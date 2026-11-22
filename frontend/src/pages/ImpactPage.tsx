import { useState, useEffect } from 'react';
import { Leaf, Award, TrendingUp, Calendar, CheckCircle2, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { impactService } from '@/services/features';

export default function ImpactPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    impactService.getSummary().then(setSummary);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="pb-4 border-b border-border dark:border-forest/30">
          <div className="flex items-center gap-2 text-xs font-bold text-mint uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5" />
            <span>Personal Sustainability Accounting</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white mt-1">
            Environmental Impact & CO2e Avoidance
          </h1>
          <p className="text-xs text-slate mt-0.5">
            Transparent, reproducible metrics tracking your cumulative reduction in urban pollution and emissions.
          </p>
        </div>

        {summary && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase text-slate">Total CO2e Saved</span>
                <div className="text-3xl font-extrabold font-display text-mint">
                  {summary.total_co2e_saved_kg} <span className="text-sm font-normal text-slate">kg</span>
                </div>
                <p className="text-[11px] text-slate">Equivalent to 2.4 urban trees planted</p>
              </div>

              <div className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase text-slate">Clean Transit Logged</span>
                <div className="text-3xl font-extrabold font-display text-charcoal dark:text-white">
                  {summary.total_sustainable_km} <span className="text-sm font-normal text-slate">km</span>
                </div>
                <p className="text-[11px] text-slate">Across {summary.total_trips_logged} tracked trips</p>
              </div>

              <div className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase text-slate">Health Exposure Credits</span>
                <div className="text-3xl font-extrabold font-display text-charcoal dark:text-white">
                  {summary.total_exposure_points} <span className="text-sm font-normal text-slate">pts</span>
                </div>
                <p className="text-[11px] text-slate">Earned via low-smog routines</p>
              </div>

              <div className="p-5 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-1">
                <span className="text-xs font-bold uppercase text-slate">Climate Champion Tier</span>
                <div className="text-lg font-bold font-display text-mint truncate mt-1">
                  {summary.current_tier}
                </div>
                <p className="text-[11px] text-slate">Top 15% in your municipality</p>
              </div>
            </div>

            {/* Weekly Savings Chart & Milestones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm">
                <h3 className="text-base font-bold font-display text-charcoal dark:text-white mb-4">
                  Weekly Carbon Avoidance (kg CO2e)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.weekly_savings_kg}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" stroke="#71818A" fontSize={12} />
                      <YAxis stroke="#71818A" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#101B20',
                          borderColor: '#173D3B',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="saved_kg" fill="#25B89A" radius={[4, 4, 0, 0]} name="CO2e Saved (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Milestones Card */}
              <div className="p-6 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-mint font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Verified Milestones</span>
                </div>
                <div className="space-y-3">
                  {summary.recent_milestones.map((m: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-charcoal dark:text-mist p-2.5 rounded-lg bg-muted/40 dark:bg-forest/15">
                      <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
