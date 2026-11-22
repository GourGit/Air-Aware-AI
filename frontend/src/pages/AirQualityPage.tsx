import { useState, useEffect } from 'react';
import { Wind, Info, ShieldCheck, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { airQualityService, type AirQualityData } from '@/services/airQuality';

export default function AirQualityPage() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [city, setCity] = useState('Delhi');

  useEffect(() => {
    airQualityService.getCurrentAir(city).then(setData);
  }, [city]);

  const pollutantBenchmark = [
    { name: 'PM2.5', current: data?.pollutants.pm25?.value || 178, standard: 60, unit: 'µg/m³' },
    { name: 'PM10', current: data?.pollutants.pm10?.value || 292, standard: 100, unit: 'µg/m³' },
    { name: 'NO2', current: data?.pollutants.no2?.value || 68, standard: 80, unit: 'µg/m³' },
    { name: 'SO2', current: data?.pollutants.so2?.value || 19.5, standard: 80, unit: 'µg/m³' },
    { name: 'CO', current: (data?.pollutants.co?.value || 1.9) * 10, standard: 20, unit: 'x0.1 mg/m³' },
    { name: 'Ozone', current: data?.pollutants.o3?.value || 38, standard: 100, unit: 'µg/m³' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-forest/30">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-charcoal dark:text-white">
              Air Quality & Pollutant Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate mt-1">
              Indian Central Pollution Control Board (CPCB) multi-pollutant index breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-white dark:bg-charcoal px-3 py-2 rounded-xl border border-border dark:border-forest/40 text-sm font-semibold text-charcoal dark:text-white"
            >
              <option value="Delhi">Delhi - Anand Vihar</option>
              <option value="Kolkata">Kolkata - Salt Lake</option>
              <option value="Mumbai">Mumbai - BKC</option>
              <option value="Bengaluru">Bengaluru - Silk Board</option>
              <option value="Chennai">Chennai - Alandur</option>
              <option value="Lucknow">Lucknow - Talkatora</option>
            </select>
          </div>
        </div>

        {/* Comparison to Indian NAAQS Standards */}
        <div className="rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold font-display text-charcoal dark:text-white">
              Current Concentrations vs Indian 24-hr Safe Limits (NAAQS)
            </h3>
            <p className="text-xs text-slate">Comparison against statutory National Ambient Air Quality Standards</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pollutantBenchmark} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#71818A" fontSize={12} />
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
                <Bar dataKey="current" fill="#25B89A" radius={[4, 4, 0, 0]} name="Observed Reading" />
                <Bar dataKey="standard" fill="#71818A" radius={[4, 4, 0, 0]} name="NAAQS Safe Limit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6 Official CPCB Categories Guide */}
        <div className="rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold font-display text-charcoal dark:text-white">
            Official Indian CPCB AQI Categories & Health Impacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { cat: 'Good', range: '0–50', color: '#009966', impact: 'Minimal impact. Clean air ideal for all.' },
              { cat: 'Satisfactory', range: '51–100', color: '#99CC33', impact: 'Minor breathing discomfort to sensitive people.' },
              { cat: 'Moderate', range: '101–200', color: '#FFCC00', impact: 'Breathing discomfort to people with asthma and lung diseases.' },
              { cat: 'Poor', range: '201–300', color: '#FF9933', impact: 'Breathing discomfort to most people on prolonged exposure.' },
              { cat: 'Very Poor', range: '301–400', color: '#CC0033', impact: 'Respiratory illness on prolonged exposure.' },
              { cat: 'Severe', range: '401–500', color: '#7E0023', impact: 'Affects healthy people and seriously impacts those with existing disease.' },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/80 dark:border-forest/40 bg-muted/30 dark:bg-forest/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: c.color }}>{c.cat}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-charcoal border border-border dark:border-forest/40">
                    AQI {c.range}
                  </span>
                </div>
                <p className="text-xs text-slate">{c.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
