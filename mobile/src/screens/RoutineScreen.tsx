import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function RoutineScreen() {
  const [routineItems, setRoutineItems] = useState([
    {
      time: '06:30 AM',
      title: 'Morning Physical Exercise',
      risk: 'High Risk (AQI 342)',
      advice: 'Indoor Yoga & Stretching recommended. Avoid outdoor running or cycling due to ground inversion.',
      isOutdoor: false,
    },
    {
      time: '08:45 AM',
      title: 'Morning Commute',
      risk: 'Moderate Risk',
      advice: 'Metro recommended. If taking auto/car, ensure vehicle cabin filter is active and recirculate air.',
      isOutdoor: true,
    },
    {
      time: '01:00 PM',
      title: 'Lunchtime & Daylight Walk',
      risk: 'Acceptable Window (AQI 220)',
      advice: 'Atmospheric boundary layer has expanded. Short 15-min walk permissible with N95 mask.',
      isOutdoor: true,
    },
    {
      time: '06:30 PM',
      title: 'Evening Return Commute',
      risk: 'High Peak Emissions',
      advice: 'Heavy traffic exhaust peak. Keep car windows closed and delay transit if feasible.',
      isOutdoor: true,
    },
  ]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pollution-Aware Daily Routine</Text>
        <Text style={styles.subtitle}>Optimized hourly schedule based on live CPCB forecasts</Text>
      </View>

      <View style={styles.timeline}>
        {routineItems.map((item, index) => (
          <View key={index} style={styles.timelineCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.timeText}>{item.time}</Text>
              <View style={[styles.badge, item.isOutdoor ? styles.badgeOutdoor : styles.badgeIndoor]}>
                <Text style={styles.badgeText}>{item.isOutdoor ? 'Outdoor' : 'Indoor'}</Text>
              </View>
            </View>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.riskText}>{item.risk}</Text>
            <Text style={styles.adviceText}>{item.advice}</Text>
          </View>
        ))}
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
    marginBottom: 16,
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
  timeline: {
    gap: 12,
    marginBottom: 30,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#25B89A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOutdoor: {
    backgroundColor: '#FFCC0020',
  },
  badgeIndoor: {
    backgroundColor: '#25B89A20',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#101B20',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101B20',
    marginBottom: 4,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CC0033',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 13,
    color: '#71818A',
    lineHeight: 18,
  },
});
