import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PollutantCardProps {
  name: string;
  value: number;
  unit: string;
  subIndex?: number;
}

export const PollutantCard: React.FC<PollutantCardProps> = ({
  name,
  value,
  unit,
  subIndex,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{name.toUpperCase()}</Text>
        {subIndex !== undefined && (
          <Text style={styles.subIndex}>Idx: {subIndex}</Text>
        )}
      </View>
      <Text style={styles.value}>
        {value} <Text style={styles.unit}>{unit}</Text>
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, ((subIndex || 50) / 400) * 100)}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71818A',
  },
  subIndex: {
    fontSize: 10,
    color: '#25B89A',
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101B20',
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71818A',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F5F8F7',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#25B89A',
    borderRadius: 2,
  },
});
