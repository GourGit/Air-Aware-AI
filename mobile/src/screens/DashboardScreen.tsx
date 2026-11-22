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
import api from '../config/api';
import type { AirDataResponse } from '../types';

export default function DashboardScreen() {
  const [data, setData] = useState<AirDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [city, setCity] = useState('Delhi');
  const requestIdRef = useRef(0);

  const fetchAQI = async () => {
    const currentReqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await api.get(`/air/current?city=${city}`);
      if (currentReqId !== requestIdRef.current) return;
      setData(res.data.data || res.data);
      setIsLive(true);
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.warn('Backend unavailable, presenting sample demonstration baseline:');
      setIsLive(false);
      setData({
        location: {
          city: city,
          station_name: `${city} Baseline Station (Sample)`,
          latitude: 28.6139,
          longitude: 77.209,
        },
        air_quality: {
          aqi: city === 'Delhi' ? 342 : city === 'Mumbai' ? 185 : 82,
          category: city === 'Delhi' ? 'Very Poor' : city === 'Mumbai' ? 'Moderate' : 'Satisfactory',
          prominent_pollutant: 'pm25',
          color: city === 'Delhi' ? '#CC0033' : city === 'Mumbai' ? '#FFCC00' : '#99CC33',
        },
        pollutants: {
          pm25: { value: 178, unit: 'µg/m³', sub_index: 342 },
          pm10: { value: 292, unit: 'µg/m³', sub_index: 242 },
          no2: { value: 68, unit: 'µg/m³', sub_index: 85 },
          so2: { value: 19.5, unit: 'µg/m³', sub_index: 24 },
          co: { value: 1.9, unit: 'mg/m³', sub_index: 95 },
          o3: { value: 38, unit: 'µg/m³', sub_index: 38 },
        },
        health_advisory: {
          summary: `Sample Demonstration: Typical particulate profile for ${city}.`,
          precautions: [
            'Reschedule outdoor cardio during morning peaks',
            'Wear N95/FFP2 respirator when commuting',
            'Keep vehicle AC in recirculate mode',
          ],
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCityChange = (newCity: string) => {
    if (newCity === city) {
      fetchAQI(); // same-city refresh
    } else {
      setData(null); // Clear previous city's readings so they cannot be misattributed to new city
      setCity(newCity);
    }
  };

  useEffect(() => {
    fetchAQI();
  }, [city]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAQI} />}
    >
      <View style={styles.header}>
        <Text style={styles.appTitle}>AirAware AI</Text>
        <Text style={styles.tagline}>Intelligent Urban Air Companion</Text>
      </View>

      {/* Notice Banner when viewing Offline Sample Data */}
      {!isLive && data && (
        <View style={styles.sampleBanner}>
          <Text style={styles.sampleBannerText}>
            Notice: Offline Mode — Showing sample baseline data. Live CAAQMS connection is pending.
          </Text>
        </View>
      )}

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
            aqi={data.air_quality.aqi}
            category={data.air_quality.category}
            color={data.air_quality.color}
            prominentPollutant={data.air_quality.prominent_pollutant}
            isLive={isLive}
          />

          {/* Health Advisory Card */}
          <View style={styles.advisoryCard}>
            <Text style={styles.advisoryTitle}>
              {isLive ? 'AI Health Advisory' : 'Sample Health Guidance'}
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
            {isLive ? `Sensor Telemetry (${data.location.city} CAAQMS)` : `Sensor Telemetry (${data.location.city} Sample)`}
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
  sampleBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  sampleBannerText: {
    color: '#B45309',
    fontSize: 12,
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
});
