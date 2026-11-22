import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function ImpactScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Climate Impact</Text>
        <Text style={styles.subtitle}>Verified carbon avoidance & urban health contribution</Text>
      </View>

      {/* Demonstration Banner */}
      <View style={styles.sampleBadge}>
        <Text style={styles.sampleBadgeText}>
          Demonstration Mode: Connect personal commute logging to track your verified savings
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>42.8</Text>
          <Text style={styles.statUnit}>kg CO₂e (Sample)</Text>
          <Text style={styles.statLabel}>Sample Emissions Avoided</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNum}>34</Text>
          <Text style={styles.statUnit}>Trips (Sample)</Text>
          <Text style={styles.statLabel}>Clean Commutes Logged</Text>
        </View>
      </View>

      {/* Tree Equivalent Card */}
      <View style={styles.treeCard}>
        <Text style={styles.treeTitle}>Ecological Impact Model</Text>
        <Text style={styles.treeDescription}>
          In this sample demonstration, avoiding 42.8 kg of CO₂e corresponds to the photosynthetic absorption of{' '}
          <Text style={styles.boldGreen}>2.1 mature urban trees</Text> over a full year according to Central Electricity Authority (CEA) benchmarks.
        </Text>
      </View>

      {/* Badges / Milestones */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Milestones Preview</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🌱</Text>
            <Text style={styles.badgeTitle}>First 10kg</Text>
            <Text style={styles.badgeStatus}>Sample Preview</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🚇</Text>
            <Text style={styles.badgeTitle}>Metro Master</Text>
            <Text style={styles.badgeStatus}>25+ Trips</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeIcon}>🌬️</Text>
            <Text style={styles.badgeTitle}>Air Guardian</Text>
            <Text style={styles.badgeStatus}>Preview</Text>
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
