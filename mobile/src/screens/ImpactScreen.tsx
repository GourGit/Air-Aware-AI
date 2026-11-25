import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { impactApi, handleApiError } from '../services/api';
import { useMobileAuthStore } from '../store/authStore';

export default function ImpactScreen() {
  const user = useMobileAuthStore((state) => state.user);
  const [summary, setSummary] = useState<{
    total_co2e_saved_kg: number;
    total_sustainable_km: number;
    total_trips_logged: number;
    current_tier: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    loadImpactSummary();
  }, [user]);

  const loadImpactSummary = async () => {
    if (!user) {
      setIsDemo(true);
      setSummary({
        total_co2e_saved_kg: 0,
        total_sustainable_km: 0,
        total_trips_logged: 0,
        current_tier: 'Eco Starter',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await impactApi.getSummary();
      setSummary(data);
      setIsDemo(false);
    } catch (err) {
      console.warn('Failed to load impact summary:', err);
      setIsDemo(true);
      setSummary({
        total_co2e_saved_kg: 0,
        total_sustainable_km: 0,
        total_trips_logged: 0,
        current_tier: 'Eco Starter',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#25B89A" />
        <Text style={styles.loadingText}>Loading your impact data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Climate Impact</Text>
        <Text style={styles.subtitle}>Verified carbon avoidance & urban health contribution</Text>
      </View>

      {isDemo && (
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>
            Demonstration Mode: Sign in and log commutes to track your verified savings
          </Text>
        </View>
      )}

      {summary && (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{summary.total_co2e_saved_kg.toFixed(1)}</Text>
              <Text style={styles.statUnit}>kg CO₂e</Text>
              <Text style={styles.statLabel}>Emissions Avoided</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNum}>{summary.total_sustainable_km.toFixed(1)}</Text>
              <Text style={styles.statUnit}>km</Text>
              <Text style={styles.statLabel}>Sustainable Distance</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNum}>{summary.total_trips_logged}</Text>
              <Text style={styles.statUnit}>Trips</Text>
              <Text style={styles.statLabel}>Clean Commutes</Text>
            </View>
          </View>

          <View style={styles.tierCard}>
            <Text style={styles.tierTitle}>Current Tier</Text>
            <Text style={styles.tierValue}>{summary.current_tier}</Text>
          </View>

          <View style={styles.treeCard}>
            <Text style={styles.treeTitle}>Ecological Impact Model</Text>
            <Text style={styles.treeDescription}>
              Avoiding {summary.total_co2e_saved_kg.toFixed(1)} kg of CO₂e corresponds to the photosynthetic absorption of{' '}
              <Text style={styles.boldGreen}>
                {(summary.total_co2e_saved_kg / 20.4).toFixed(1)} mature urban trees
              </Text>{' '}
              over a full year according to Central Electricity Authority (CEA) benchmarks.
            </Text>
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardHeader}>How to Improve Your Impact</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🚇</Text>
            <Text style={styles.badgeTitle}>Choose Metro</Text>
            <Text style={styles.badgeStatus}>Lowest emissions</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🚲</Text>
            <Text style={styles.badgeTitle}>Cycle / Walk</Text>
            <Text style={styles.badgeStatus}>Zero emissions</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🚌</Text>
            <Text style={styles.badgeTitle}>Electric Bus</Text>
            <Text style={styles.badgeStatus}>Low emissions</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
    padding: 16,
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
  header: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#101B20',
  },
  subtitle: {
    fontSize: 13,
    color: '#71818A',
    marginTop: 4,
  },
  sampleBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  sampleBadgeText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: '900',
    color: '#25B89A',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71818A',
    textTransform: 'uppercase',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#101B20',
    marginTop: 6,
    textAlign: 'center',
  },
  tierCard: {
    backgroundColor: '#173D3B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#25B89A',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tierValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  treeCard: {
    backgroundColor: '#173D3B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  treeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#25B89A',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  treeDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  boldGreen: {
    fontWeight: '800',
    color: '#25B89A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
    marginBottom: 30,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101B20',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101B20',
  },
  badgeStatus: {
    fontSize: 10,
    color: '#25B89A',
    fontWeight: '600',
  },
});