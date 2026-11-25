import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AQIGauge } from '../components/AQIGauge';
import { PollutantCard } from '../components/PollutantCard';
import { api } from '../services/api';
import type { AirDataResponse } from '../types';

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

export default function DashboardScreen() {
  const [data, setData] = useState<AirDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [city, setCity] = useState('Delhi');
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const requestIdRef = useRef(0);

  const fetchAQI = async () => {
    const currentReqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await api.get(`/air/current?city=${city}`);
      if (currentReqId !== requestIdRef.current) return;
      const responseData = res.data.data || res.data;
      setData(responseData);
      setIsLive(responseData.metadata?.data_type === 'observed');

      // Fetch historical data if live
      if (responseData.location?.station_id && responseData.metadata?.data_type === 'observed') {
        await fetchHistory(responseData.location.station_id);
      } else {
        setHistoricalData([]);
      }
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.warn('Backend unavailable, presenting demo baseline data:', err);
      setIsLive(false);
      setData({
        location: {
          name: `${city} Baseline Station (Demo)`,
          city: city,
          state: city === 'Delhi' ? 'Delhi' : city === 'Mumbai' ? 'Maharashtra' : city === 'Bengaluru' ? 'Karnataka' : city === 'Kolkata' ? 'West Bengal' : city === 'Chennai' ? 'Tamil Nadu' : 'Uttar Pradesh',
          latitude: 28.6139,
          longitude: 77.209,
          station_id: `demo-${city.toLowerCase()}`,
        },
        air_quality: {
          aqi: city === 'Delhi' ? 342 : city === 'Mumbai' ? 185 : 82,
          category: city === 'Delhi' ? 'Very Poor' : city === 'Mumbai' ? 'Moderate' : 'Satisfactory',
          prominent_pollutant: 'pm25',
          color: city === 'Delhi' ? '#CC0033' : city === 'Mumbai' ? '#FFCC00' : '#99CC33',
          standard: 'IN_CPCB',
          status: 'demo',
          is_standard_met: true,
        },
        pollutants: {
          pm25: { value: 178, unit: 'µg/m³', sub_index: 342 },
          pm10: { value: 292, unit: 'µg/m³', sub_index: 242 },
          no2: { value: 68, unit: 'µg/m³', sub_index: 85 },
          so2: { value: 19.5, unit: 'µg/m³', sub_index: 24 },
          co: { value: 1.9, unit: 'mg/m³', sub_index: 95 },
          o3: { value: 38, unit: 'µg/m³', sub_index: 38 },
          nh3: { value: 35, unit: 'µg/m³', sub_index: 42 },
        },
        health_advisory: {
          summary: `Demo Data: Typical particulate profile for ${city}.`,
          precautions: [
            'Reschedule outdoor cardio during morning peaks',
            'Wear N95/FFP2 respirator when commuting',
            'Keep vehicle AC in recirculate mode',
          ],
        },
        metadata: {
          source: `Official ${city === 'Delhi' ? 'DPCC' : city === 'Mumbai' ? 'MPCB' : city === 'Bengaluru' ? 'KSPCB' : city === 'Kolkata' ? 'WBPCB' : city === 'Chennai' ? 'TNPCB' : 'UPPCB'} CAAQMS (Demo Data)`,
          observed_at: null,
          retrieved_at: new Date().toISOString(),
          data_type: 'demo',
          is_stale: true,
          is_demo: true,
          station_distance_km: null,
          data_freshness: 'unknown',
        },
      });
      setHistoricalData([]);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
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

  const handleCityChange = (newCity: string) => {
    if (newCity === city) {
      fetchAQI();
    } else {
      setData(null);
      setHistoricalData([]);
      setCity(newCity);
    }
  };

  useEffect(() => {
    fetchAQI();
  }, [city]);

  // Render simple trend indicator
  const renderTrend = () => {
    if (historicalData.length < 2) return null;

    const latest = historicalData[historicalData.length - 1];
    const oldest = historicalData[0];
    if (latest.aqi === null || oldest.aqi === null) return null;

    const change = latest.aqi - oldest.aqi;
    const trend = change > 10 ? 'rising' : change < -10 ? 'falling' : 'stable';
    const trendColor = trend === 'rising' ? '#DC2626' : trend === 'falling' ? '#25B89A' : '#F59E0B';
    const trendIcon = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→';

    return (
      <View style={[styles.trendBadge, { backgroundColor: `${trendColor}20`, borderColor: trendColor }]}>
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trendIcon} 24h Trend: {trend.charAt(0).toUpperCase() + trend.slice(1)} ({change > 0 ? '+' : ''}{change} AQI)
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAQI} />}
    >
      <View style={styles.header}>
        <Text style={styles.appTitle}>AirAware AI</Text>
        <Text style={styles.tagline}>Intelligent Urban Air Companion</Text>
      </View>

      {/* Data Source Banner */}
      {data && (
        <View style={[
          styles.sourceBanner,
          data.metadata?.is_demo && styles.sourceBannerDemo,
          data.metadata?.data_type === 'unavailable' && styles.sourceBannerUnavailable,
        ]}>
          <Text style={[
            styles.sourceBannerText,
            data.metadata?.is_demo && styles.sourceBannerDemoText,
            data.metadata?.data_type === 'unavailable' && styles.sourceBannerUnavailableText,
          ]}>
            {data.metadata?.data_type === 'observed'
              ? `Live CAAQMS • ${data.metadata?.data_freshness || 'recent'}`
              : data.metadata?.is_demo
              ? 'Demo Data • Not live measurements'
              : data.metadata?.data_type === 'unavailable'
              ? 'Data Unavailable'
              : 'Estimated • Incomplete pollutant data'}
          </Text>
        </View>
      )}

      {/* Trend Indicator */}
      {renderTrend()}

      {/* City Switcher Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityTabs}>
        {['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.cityTab, city === c && styles.cityTabActive]}
            onPress={() => handleCityChange(c)}
          >
            <Text style={[styles.cityTabText, city === c && styles.cityTabTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading state between city switches */}
      {loading && !data && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#25B89A" />
          <Text style={styles.loadingText}>Fetching CAAQMS telemetry for {city}...</Text>
        </View>
      )}

      {data && (
        <>
          <AQIGauge
            aqi={data.air_quality.aqi ?? 0}
            category={data.air_quality.category}
            color={data.air_quality.color}
            prominentPollutant={data.air_quality.prominent_pollutant ?? 'N/A'}
            isLive={isLive}
            isDemo={data.metadata?.is_demo}
          />

          {/* Health Advisory Card */}
          <View style={styles.advisoryCard}>
            <Text style={styles.advisoryTitle}>
              {isLive ? 'AI Health Advisory' : data.metadata?.is_demo ? 'Demo Health Guidance' : 'Health Guidance'}
            </Text>
            <Text style={styles.advisorySummary}>{data.health_advisory.summary}</Text>
            {data.health_advisory.precautions.map((p, i) => (
              <View key={i} style={styles.precautionRow}>
                <View style={styles.bullet} />
                <Text style={styles.precautionText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Pollutant Sensor Grid */}
          <Text style={styles.sectionTitle}>
            {isLive ? `Sensor Telemetry (${data.location.city} CAAQMS)` : data.metadata?.is_demo ? `Sensor Telemetry (${data.location.city} Demo)` : `Sensor Data`}
          </Text>
          <View style={styles.pollutantGrid}>
            {Object.entries(data.pollutants).map(([name, item]) => (
              <PollutantCard
                key={name}
                name={name}
                value={item.value}
                unit={item.unit}
                subIndex={item.sub_index}
              />
            ))}
            {Object.keys(data.pollutants).length === 0 && (
              <View style={styles.emptyPollutants}>
                <Text style={styles.emptyPollutantsText}>No pollutant measurements available</Text>
              </View>
            )}
          </View>

          {/* Data Provenance Footer */}
          <View style={styles.provenanceCard}>
            <Text style={styles.provenanceTitle}>Data Provenance</Text>
            <Text style={styles.provenanceRow}>
              <Text style={styles.provenanceLabel}>Source: </Text>
              <Text>{data.metadata?.source || 'Unknown'}</Text>
            </Text>
            <Text style={styles.provenanceRow}>
              <Text style={styles.provenanceLabel}>Observed: </Text>
              <Text>{data.metadata?.observed_at ? new Date(data.metadata.observed_at).toLocaleString() : 'N/A'}</Text>
            </Text>
            <Text style={styles.provenanceRow}>
              <Text style={styles.provenanceLabel}>Retrieved: </Text>
              <Text>{data.metadata?.retrieved_at ? new Date(data.metadata.retrieved_at).toLocaleString() : 'N/A'}</Text>
            </Text>
            <Text style={styles.provenanceRow}>
              <Text style={styles.provenanceLabel}>Freshness: </Text>
              <Text>{data.metadata?.data_freshness || 'unknown'}</Text>
            </Text>
            {data.metadata?.station_distance_km && (
              <Text style={styles.provenanceRow}>
                <Text style={styles.provenanceLabel}>Station Distance: </Text>
                <Text>~{data.metadata.station_distance_km} km</Text>
              </Text>
            )}
            {data.metadata?.is_demo && (
              <Text style={[styles.provenanceRow, styles.provenanceDemoNote]}>
                ⚠ This is demonstration data, not live CPCB measurements.
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
    padding: 16,
  },
  header: {
    marginTop: 20,
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#101B20',
  },
  tagline: {
    fontSize: 13,
    color: '#71818A',
    fontWeight: '500',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#71818A',
    fontSize: 13,
    fontWeight: '600',
  },
  sourceBanner: {
    backgroundColor: '#E8F5E9',
    borderColor: '#25B89A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  sourceBannerDemo: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  sourceBannerUnavailable: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  sourceBannerText: {
    color: '#173D3B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sourceBannerDemoText: {
    color: '#B45309',
  },
  sourceBannerUnavailableText: {
    color: '#B91C1C',
  },
  trendBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#25B89A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
    alignSelf: 'center',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cityTabs: {
    marginVertical: 10,
  },
  cityTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  cityTabActive: {
    backgroundColor: '#25B89A',
    borderColor: '#25B89A',
  },
  cityTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71818A',
  },
  cityTabTextActive: {
    color: '#FFFFFF',
  },
  advisoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  advisoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#173D3B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  advisorySummary: {
    fontSize: 13,
    color: '#101B20',
    marginBottom: 10,
    lineHeight: 18,
  },
  precautionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#25B89A',
  },
  precautionText: {
    fontSize: 12,
    color: '#71818A',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101B20',
    marginTop: 14,
    marginBottom: 8,
  },
  pollutantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 40,
  },
  emptyPollutants: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPollutantsText: {
    color: '#71818A',
    fontSize: 13,
  },
  provenanceCard: {
    backgroundColor: '#F5F8F7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  provenanceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#101B20',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  provenanceRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  provenanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71818A',
  },
  provenanceDemoNote: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
  },
});