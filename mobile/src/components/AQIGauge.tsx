import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AQIGaugeProps {
  aqi: number;
  category: string;
  color: string;
  prominentPollutant: string;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({
  aqi,
  category,
  color,
  prominentPollutant,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.subTitle}>OFFICIAL CPCB NAQI</Text>
        <View style={styles.badge}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.badgeText}>Live CAAQMS</Text>
        </View>
      </View>

      <View style={styles.readingRow}>
        <Text style={[styles.aqiNumber, { color }]}>{aqi}</Text>
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryPill, { backgroundColor: `${color}25` }]}>
            <Text style={[styles.categoryText, { color }]}>{category}</Text>
          </View>
          <Text style={styles.prominentText}>
            Prominent: <Text style={styles.boldText}>{prominentPollutant.toUpperCase()}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#173D3B',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitle: {
    color: '#71818A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    color: '#25B89A',
    fontSize: 11,
    fontWeight: '600',
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aqiNumber: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  prominentText: {
    color: '#DCE6E2',
    fontSize: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
