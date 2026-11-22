import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Marker } from '@vis.gl/react-google-maps';
import { AppLayout } from '@/components/layout/AppLayout';
import { airQualityService, type Station } from '@/services/airQuality';

export default function AirMapPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const googleMapsApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const mapId = ((import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID || '').trim() || undefined;
  const hasKey = Boolean(googleMapsApiKey && googleMapsApiKey !== 'your_google_maps_key_here');

  // Google Maps is only active after confirmed successful load without script or auth errors
  const isGoogleMapsActive = Boolean(hasKey && mapLoaded && !mapError);

  useEffect(() => {
    airQualityService.getStations().then((data) => {
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0]);
      }
    });
  }, []);

  const filteredStations = stations.filter((s) => {
    if (selectedFilter === 'All') return true;
    return s.category.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border dark:border-forest/30">
          <div>
            <h1 className="text-2xl font-extrabold font-display text-charcoal dark:text-white">
              National Air Quality Map
            </h1>
            <p className="text-xs text-slate">
              Geospatial monitoring stations across India using official CPCB CAAQMS sensors.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedFilter === cat
                    ? 'bg-mint text-white'
                    : 'bg-white dark:bg-charcoal border border-border dark:border-forest/40 text-slate hover:text-charcoal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Map Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Main Map Container */}
          <div className="lg:col-span-2 rounded-2xl border border-border dark:border-forest/40 bg-muted/60 dark:bg-charcoal/80 overflow-hidden relative shadow-inner flex flex-col justify-between">
            {/* Top Overlay Bar */}
            <div className="flex justify-between items-start z-10 p-4 pointer-events-none">
              <div className="bg-white/90 dark:bg-charcoal/90 backdrop-blur px-3 py-2 rounded-xl border border-border dark:border-forest/40 shadow-sm text-xs text-charcoal dark:text-white flex items-center gap-2 pointer-events-auto">
                <Navigation className="w-3.5 h-3.5 text-mint" />
                <span>Coverage: India National CAAQMS Network</span>
              </div>
              <div className="bg-white/90 dark:bg-charcoal/90 backdrop-blur px-3 py-1.5 rounded-xl border border-border dark:border-forest/40 shadow-sm text-xs font-semibold text-slate pointer-events-auto">
                {isGoogleMapsActive ? 'Google Maps Mode' : hasKey && !mapError ? 'Loading Google Maps...' : 'Interactive Geospatial Canvas'} ({filteredStations.length} Stations)
              </div>
            </div>

            {/* Provider wrapper mounted when key is present to track load/error states */}
            {hasKey && (
              <div className={isGoogleMapsActive ? 'absolute inset-0' : 'hidden'}>
                <APIProvider
                  apiKey={googleMapsApiKey}
                  onLoad={() => {
                    setMapLoaded(true);
                    setMapError(false);
                  }}
                  onError={(err) => {
                    console.warn('Google Maps script load error, falling back to canvas:', err);
                    setMapError(true);
                  }}
                >
                  <Map
                    defaultCenter={{ lat: 21.7679, lng: 78.8718 }}
                    defaultZoom={5}
                    mapId={mapId}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    className="w-full h-full"
                  >
                    {filteredStations.map((s) =>
                      mapId ? (
                        <AdvancedMarker
                          key={s.id}
                          position={{ lat: s.latitude, lng: s.longitude }}
                          onClick={() => setSelectedStation(s)}
                          title={`${s.name} (AQI ${s.aqi})`}
                        >
                          <div
                            className="px-2 py-1 rounded-full text-[11px] font-bold text-white shadow-xl flex items-center gap-1 border-2 border-white transform transition-transform hover:scale-125 cursor-pointer"
                            style={{ backgroundColor: s.color }}
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{s.aqi}</span>
                          </div>
                        </AdvancedMarker>
                      ) : (
                        <Marker
                          key={s.id}
                          position={{ lat: s.latitude, lng: s.longitude }}
                          onClick={() => setSelectedStation(s)}
                          title={`${s.name} (AQI ${s.aqi})`}
                        />
                      ),
                    )}
                  </Map>
                </APIProvider>
              </div>
            )}

            {/* Render Canvas when Maps is not active (not configured, loading, or on error) */}
            {!isGoogleMapsActive && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full h-full relative border border-dashed border-border dark:border-forest/30 rounded-xl bg-forest/5 flex items-center justify-center">
                  <span className="text-xs text-slate/40 uppercase tracking-widest font-mono">
                    Official CAAQMS Geographic Coordinate Grid
                  </span>

                  {filteredStations.map((s) => {
                    // Coordinate offset calculation for visual distribution across Indian subcontinent
                    const leftPercent = 20 + ((s.longitude - 72) / (89 - 72)) * 60;
                    const topPercent = 80 - ((s.latitude - 12) / (29 - 12)) * 60;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStation(s)}
                        style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                          selectedStation?.id === s.id ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                        }`}
                      >
                        <div
                          className="px-2 py-1 rounded-full text-[11px] font-bold text-white shadow-lg flex items-center gap-1 border border-white/50"
                          style={{ backgroundColor: s.color }}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{s.aqi}</span>
                        </div>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-charcoal/90 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {s.name.split(',')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Overlay Notice */}
            <div className="z-10 m-4 bg-white/90 dark:bg-charcoal/90 backdrop-blur p-3 rounded-xl border border-border dark:border-forest/40 text-[11px] text-slate max-w-md pointer-events-auto">
              <strong className="text-charcoal dark:text-white">CPCB Data Notice: </strong>
              Markers indicate verified Continuous Ambient Air Quality Monitoring Stations (CAAQMS).
              {!isGoogleMapsActive && (
                <span className="block mt-0.5 text-[10px] text-slate/80">
                  {mapError
                    ? '(Google Maps authentication or network issue detected — running in Coordinate Canvas mode)'
                    : '(To activate Google Maps satellite/vector tiles, supply VITE_GOOGLE_MAPS_API_KEY in frontend/.env)'}
                </span>
              )}
            </div>
          </div>

          {/* Station Details Inspector Card */}
          <div className="rounded-2xl border border-border dark:border-forest/40 bg-white dark:bg-charcoal p-6 shadow-sm flex flex-col justify-between overflow-y-auto">
            {selectedStation ? (
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate tracking-wider">
                    Station Telemetry Inspector
                  </span>
                  <h3 className="text-xl font-bold font-display text-charcoal dark:text-white mt-1">
                    {selectedStation.name}
                  </h3>
                  <p className="text-xs text-slate mt-0.5">
                    {selectedStation.city}, {selectedStation.state} • {selectedStation.agency}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border dark:border-forest/30 bg-muted/40 dark:bg-forest/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate font-medium">CPCB AQI Reading</span>
                    <div className="text-4xl font-extrabold font-display mt-0.5" style={{ color: selectedStation.color }}>
                      {selectedStation.aqi}
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ backgroundColor: `${selectedStation.color}20`, color: selectedStation.color }}
                  >
                    {selectedStation.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-slate">Live Pollutant Sensor Concentrations</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedStation.pollutants).map(([pol, val]) => (
                      <div key={pol} className="p-2.5 rounded-lg border border-border/80 dark:border-forest/30 bg-white dark:bg-charcoal">
                        <span className="text-[10px] uppercase font-bold text-slate">{pol}</span>
                        <p className="text-sm font-bold text-charcoal dark:text-white mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-mint/5 border border-mint/20 text-xs text-slate space-y-1">
                  <p><strong>Coordinates:</strong> {selectedStation.latitude}, {selectedStation.longitude}</p>
                  <p><strong>Source:</strong> {selectedStation.source}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate text-sm">
                Select a station on the map to inspect telemetry
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
