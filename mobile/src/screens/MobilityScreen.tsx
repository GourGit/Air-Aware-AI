import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';

export default function MobilityScreen() {
  const [distance, setDistance] = useState('12');

  const modes = [
    {
      name: 'Delhi Metro (Electric)',
      factor: 8.5,
      savings: 1450,
      exposure: 'Low (Filtered AC)',
      color: '#25B89A',
    },
    {
      name: 'Electric Bus (DTC)',
      factor: 18.0,
      savings: 1280,
      exposure: 'Moderate',
      color: '#25B89A',
    },
    {
      name: 'Auto Rickshaw (CNG)',
      factor: 65.0,
      savings: 650,
      exposure: 'High (Direct Exhaust)',
      color: '#FFCC00',
    },
    {
      name: 'Private Petrol Car',
      factor: 142.0,
      savings: 0,
      exposure: 'Moderate (With AC)',
      color: '#CC0033',
    },
  ];

  const parsedDist = parseFloat(distance.trim());
  const isValid = !isNaN(parsedDist) && isFinite(parsedDist) && parsedDist >= 0;
  const distNum = isValid ? parsedDist : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sustainable Mobility Advisor</Text>
        <Text style={styles.subtitle}>
          Compare travel emissions & personal pollution exposure (ARAI/CEA factors)
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Trip Commute Distance (km):</Text>
        <TextInput
          style={[styles.input, !isValid && styles.inputError]}
          keyboardType="numeric"
          value={distance}
          onChangeText={setDistance}
          placeholder="Enter distance (e.g. 12)"
        />
        {!isValid && (
          <Text style={styles.errorText}>
            Please enter a valid, non-negative numerical distance in kilometers.
          </Text>
        )}
      </View>

      <View style={styles.modeList}>
        {isValid ? (
          modes.map((m, idx) => {
            const totalEmissions = Math.round(m.factor * distNum);
            return (
              <View key={idx} style={styles.modeCard}>
                <View style={styles.modeHeader}>
                  <Text style={styles.modeName}>{m.name}</Text>
                  <Text style={[styles.emissionsNum, { color: m.color }]}>
                    {totalEmissions} g CO₂e
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Air Exposure Risk:</Text>
                  <Text style={styles.detailValue}>{m.exposure}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CO₂e Avoided vs Private Car:</Text>
                  <Text style={styles.savingsValue}>
                    {Math.max(0, Math.round((142.0 - m.factor) * distNum))} g avoided
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Enter a valid distance above to calculate and display transit emissions.
            </Text>
          </View>
        )}
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
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101B20',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6E2',
    backgroundColor: '#F5F8F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#101B20',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  modeList: {
    gap: 12,
    marginBottom: 30,
  },
  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DCE6E2',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#71818A',
    fontSize: 13,
    textAlign: 'center',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#101B20',
  },
  emissionsNum: {
    fontSize: 15,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: '#71818A',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#101B20',
  },
  savingsValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25B89A',
  },
});
