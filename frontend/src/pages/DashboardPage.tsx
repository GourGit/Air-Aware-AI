import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wind, Shield, Activity, MapPin, AlertTriangle, ArrowRight, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { airQualityService, type AirQualityData, type ForecastPoint } from '@/services/airQuality';
import { api } from '@/services/api';

interface HistoricalPoint {
  time: string;
  aqi: number | null;
  category: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  o3: number | null;
  dominant_pollutant: string | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Delhi');
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await airQualityService.getCurrentAir(city);
      setData(res);
      // Fetch historical data if we have a station ID
      if (res.location.station_id && res.metadata.data_type === 'observed') {
        await fetchHistory(res.location.station_id);
      } else {
        setHistoricalData([]);
      }
    } catch (e) {
      console.error(e);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (stationId: string) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/air/history/${stationId}`, { params: { hours: 24 } });
      if (res.data?.data && Array.isArray(res.data.data)) {
        setHistoricalData(res.data.data);
      }
    } catch (e) {
      console.warn('Historical data unavailable:', e);
      setHistoricalData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format historical data for chart
  const trendData = historicalData.length > 0
    ? historicalData.map((point) => ({
        time: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: point.aqi ?? 0,
        pm25: point.pm25 ?? 0,
      }))
    : [];

  useEffect(() => {
    fetchData();
  }, [city]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header & City Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border dark:border-forest/30">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate uppercase tracking-wider">
              <span>Environmental Intelligence Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-charcoal dark:text-white mt-1">
              Urban Air Quality Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-charcoal px-3 py-1.5 rounded-xl border border-border dark:border-forest/40">
              <MapPin className="w-4 h-4 text-mint shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-sm font-semibold text-charcoal dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="Delhi">Delhi (Anand Vihar)</option>
                <option value="Kolkata">Kolkata (Salt Lake)</option>
                <option value="Mumbai">Mumbai (BKC)</option>
                <option value="Bengaluru">Bengaluru (Silk Board)</option>
                <option value="Chennai">Chennai (Alandur)</option>
                <option value="Lucknow">Lucknow (Talkatora)</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5" disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Hero AQI Gauge Card */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate font-semibold mb-4">
                  <span>
                    {data.air_quality.status === 'live'
                      ? 'LIVE CPCB STATION'
                      : data.air_quality.status === 'demo'
                      ? 'DEMO BASELINE STATION'
                      : data.air_quality.status === 'estimated_incomplete_data'
                      ? 'ESTIMATED (Incomplete Data)'
                      : 'STATION DATA UNAVAILABLE'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      data.air_quality.status === 'live' ? 'text-mint' :
                      data.air_quality.status === 'demo' ? 'text-amber-500' :
                      'text-slate'
                    }`}
                  >
                    {data.air_quality.status === 'live' && (
                      <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
                    )}
                    {data.air_quality.status === 'live'
                      ? 'Live CAAQMS'
                      : data.air_quality.status === 'demo'
                      ? 'Demo Data'
                      : data.air_quality.status === 'estimated_incomplete_data'
                      ? 'Estimated'
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="flex items-baseline gap-4 my-2">
                  <span
                    className="text-6xl font-extrabold font-display"
                    style={{ color: data.air_quality.color }}
                  >
                    {data.air_quality.aqi ?? '—'}
                  </span>
                  <div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${data.air_quality.color}20`,
                        color: data.air_quality.color,
                      }}
                    >
                      {data.air_quality.category}
                    </span>
                    <p className="text-xs text-slate mt-1.5">
                      Prominent: <strong className="uppercase text-charcoal dark:text-white">{data.air_quality.prominent_pollutant ?? 'N/A'}</strong>
                    </p>
                    {data.air_quality.status === 'estimated_incomplete_data' && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠ AQI estimated from incomplete pollutant data
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate mt-4 leading-relaxed">
                  {data.health_advisory.summary}
                </p>
              </div>

              <div className="pt-6 border-t border-border dark:border-forest/30 mt-6 text-xs text-slate flex justify-between items-center">
                <span>Station: {data.location.name}</span>
                <span className="text-[10px]">
                  {data.metadata.is_demo ? 'Demo' : 'CPCB NAQI'}
                  {data.metadata.station_distance_km && ` • ~${data.metadata.station_distance_km}km`}
                </span>
              </div>
            </div>

            {/* Pollutants Breakdown Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(data.pollutants).map(([key, pol]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center text-xs text-slate uppercase font-semibold">
                    <span>{key.toUpperCase()}</span>
                    {pol.sub_index !== undefined && (
                      <span className="text-[10px] bg-muted dark:bg-forest/20 px-2 py-0.5 rounded">
                        Sub-idx: {pol.sub_index}
                      </span>
                    )}
                  </div>
                  <div className="my-3">
                    <span className="text-2xl font-bold font-display text-charcoal dark:text-white">
                      {pol.value}
                    </span>
                    <span className="text-xs text-slate ml-1">{pol.unit}</span>
                  </div>
                  <div className="w-full bg-muted dark:bg-forest/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-mint rounded-full"
                      style={{ width: `${Math.min(100, (pol.sub_index || 50) / 4)}%` }}
                    />
                  </div>
                </div>
              ))}

              {Object.keys(data.pollutants).length === 0 && (
                <div className="lg:col-span-3 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-8 text-center">
                  <p className="text-slate">No pollutant data available</p>
                  <p className="text-xs text-slate mt-2">
                    {data.metadata.is_demo ? 'Demo data does not include live measurements' : 'Live measurements unavailable'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 24-Hour Trend Chart & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-charcoal dark:text-white">
                  24-Hour AQI & PM2.5 Trend
                </h3>
                <p className="text-xs text-slate">
                  {historicalData.length > 0
                    ? 'Observed hourly measurements from monitoring station'
                    : 'Historical data unavailable — showing no trend'}
                </p>
              </div>
              <span className="text-xs font-semibold text-mint bg-mint/10 px-2.5 py-1 rounded-full">
                {historicalData.length > 0 ? 'Past 24 Hours (Live)' : 'No Data'}
              </span>
            </div>

            <div className="h-64 w-full">
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#25B89A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#25B89A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#71818A" fontSize={11} />
                    <YAxis stroke="#71818A" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101B20',
                        borderColor: '#173D3B',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="aqi" stroke="#25B89A" strokeWidth={2.5} fillOpacity={1} fill="url(#aqiGrad)" name="CPCB AQI" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate">
                  <p className="text-center">No historical data available for this station</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Environmental Advice Card */}
          <div className="rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-mint font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>AI Intelligent Advisory</span>
              </div>
              <h4 className="text-lg font-bold font-display text-charcoal dark:text-white">
                Today's Environmental Guidance
              </h4>
              <p className="text-xs text-slate leading-relaxed">
                {data?.health_advisory.summary}
              </p>
              <ul className="space-y-2 mt-3">
                {data?.health_advisory.precautions.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-charcoal dark:text-mist">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-border dark:border-forest/30 flex gap-2">
              <Link to="/assistant" className="flex-1">
                <Button size="sm" className="w-full bg-mint hover:bg-mint/90 text-white text-xs">
                  Get Mobile App
                </Button>
              </Link>
              <Link to="/map" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Pollution Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}