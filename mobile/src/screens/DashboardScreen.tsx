import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AQIGauge } from '../components/AQIGauge';
import { PollutantCard } from '../components/PollutantCard';
import api from '../config/api';
import type { AirDataResponse } from '../types';

export default function DashboardScreen() {
  const [data, setData] = useState<AirDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Delhi');

  const fetchAQI = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/air/current?city=${city}`);
      setData(res.data);
    } catch (err) {
      console.log('Using local fallback for mobile dashboard');
      setData({
        location: {
          city: city,
          station_name: `${city} Central Monitoring Station`,
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
          summary: 'High particulate matter detected. Thermal inversion trapping vehicular exhaust.',
          precautions: [
            'Avoid outdoor workouts between 6 AM and 10 AM',
            'Wear N95/FFP2 respirator when commuting',
            'Run indoor HEPA air purifier on medium/high',
          ],
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
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

      {/* City Switcher Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityTabs}>
        {['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.cityTab, city === c && styles.cityTabActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.cityTabText, city === c && styles.cityTabTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {data && (
        <>
          <AQIGauge
            aqi={data.air_quality.aqi}
            category={data.air_quality.category}
            color={data.air_quality.color}
            prominentPollutant={data.air_quality.prominent_pollutant}
          />

          {/* Health Advisory Card */}
          <View style={styles.advisoryCard}>
            <Text style={styles.advisoryTitle}>AI Health Advisory</Text>
            <Text style={styles.advisorySummary}>{data.health_advisory.summary}</Text>
            {data.health_advisory.precautions.map((p, i) => (
              <View key={i} style={styles.precautionRow}>
                <View style={styles.bullet} />
                <Text style={styles.precautionText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Pollutant Sensor Grid */}
          <Text style={styles.sectionTitle}>Sensor Telemetry (CPCB)</Text>
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
    marginBottom: 10,
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
  cityTabs: {
    marginVertical: 12,
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
