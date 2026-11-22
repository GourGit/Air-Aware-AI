import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function IndoorAirScreen() {
  const [ventilationOpen, setVentilationOpen] = useState(false);
  const [purifierOn, setPurifierOn] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Indoor Air Quality Advisor</Text>
        <Text style={styles.subtitle}>Microclimate intelligence for home & workspace hygiene</Text>
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>ESTIMATED INDOOR AIR HYGIENE SCORE</Text>
        <Text style={styles.scoreValue}>{purifierOn ? '78' : '42'} / 100</Text>
        <Text style={[styles.scoreStatus, !purifierOn && styles.scoreStatusOff]}>
          {purifierOn ? 'Protected with HEPA Filtration' : 'Unprotected — Air Purifier is Off'}
        </Text>
      </View>

      {/* Sample Guidance Notice */}
      <View style={styles.sampleBanner}>
        <Text style={styles.sampleBannerText}>
          Sample Guidance: Connect room air sensors or live outdoor station feed to calibrate real-time indoor advisories.
        </Text>
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sample Guidance & Scenarios</Text>
        <View style={styles.recommendationItem}>
          <Text style={styles.recHeadline}>During Elevated Outdoor Inversion (e.g. AQI &gt; 300)</Text>
          <Text style={styles.recDescription}>
            Do NOT open windows or natural ventilation vents during morning inversion hours. Keep doors and balcony access sealed.
          </Text>
        </View>

        <View style={styles.recommendationItem}>
          <Text style={styles.recHeadline}>Cooking & Indoor Combustion Sources</Text>
          <Text style={styles.recDescription}>
            Operate kitchen exhaust chimney with high suction when frying or using spices. Minimize incense/dhoop burning.
          </Text>
        </View>
      </View>

      {/* Device Management Toggle Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simulated Appliance Controls</Text>
        <View style={styles.deviceRow}>
          <View>
            <Text style={styles.deviceName}>HEPA Air Purifier</Text>
            <Text style={styles.deviceSub}>Living Room • CADR 380 m³/h</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, purifierOn ? styles.toggleBtnActive : styles.toggleBtnOff]}
            onPress={() => setPurifierOn(!purifierOn)}
          >
            <Text style={[styles.toggleBtnText, purifierOn && styles.toggleBtnTextActive]}>
              {purifierOn ? 'Running' : 'Turn On'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deviceRow}>
          <View>
            <Text style={styles.deviceName}>Natural Ventilation (Windows)</Text>
            <Text style={styles.deviceSub}>Guidance: Keep Closed</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, ventilationOpen && styles.toggleBtnWarning]}
            onPress={() => setVentilationOpen(!ventilationOpen)}
          >
            <Text style={[styles.toggleBtnText, ventilationOpen && styles.toggleBtnTextActive]}>
              {ventilationOpen ? 'Open' : 'Closed'}
            </Text>
          </TouchableOpacity>
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
    marginBottom: 12,
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
  sampleBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  sampleBannerText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#173D3B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#25B89A',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  scoreStatus: {
    fontSize: 13,
    color: '#DCE6E2',
    fontWeight: '600',
  },
  scoreStatusOff: {
    color: '#EF4444',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101B20',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  recommendationItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F5F8F7',
  },
  recHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101B20',
    marginBottom: 4,
  },
  recDescription: {
    fontSize: 12,
    color: '#71818A',
    lineHeight: 18,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101B20',
  },
  deviceSub: {
    fontSize: 11,
    color: '#71818A',
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F8F7',
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  toggleBtnActive: {
    backgroundColor: '#25B89A',
    borderColor: '#25B89A',
  },
  toggleBtnOff: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  toggleBtnWarning: {
    backgroundColor: '#CC0033',
    borderColor: '#CC0033',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71818A',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
});
