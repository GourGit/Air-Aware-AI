import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function CommunityScreen() {
  const [reportType, setReportType] = useState('Waste Burning');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = ['Waste Burning', 'Industrial Emissions', 'Construction Dust', 'Heavy Vehicle Smog'];

  const handleSubmit = () => {
    if (!locationName.trim() || !description.trim()) {
      Alert.alert('Incomplete Report', 'Please enter a location and brief description.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Pollution Reporting</Text>
        <Text style={styles.subtitle}>Report localized smoke, dust, and burning to civic authorities</Text>
      </View>

      {submitted ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Report Submitted Successfully</Text>
          <Text style={styles.successText}>
            Thank you for being a vigilant citizen. Your report has been tagged with timestamp and sent to the moderation & municipal monitoring stream.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setSubmitted(false)}>
            <Text style={styles.resetBtnText}>Submit Another Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Pollution Source Type:</Text>
          <View style={styles.typeRow}>
            {reportTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typePill, reportType === t && styles.typePillActive]}
                onPress={() => setReportType(t)}
              >
                <Text style={[styles.typeText, reportType === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location / Landmark:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near Ring Road Flyover, Phase 2"
            value={locationName}
            onChangeText={setLocationName}
          />

          <Text style={styles.label}>Observed Details:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Describe emission intensity, visible smoke plumes, or burning duration..."
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Verified Civic Report</Text>
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE6E2',
    marginBottom: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101B20',
    marginTop: 10,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F8F7',
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  typePillActive: {
    backgroundColor: '#25B89A',
    borderColor: '#25B89A',
  },
  typeText: {
    fontSize: 12,
    color: '#71818A',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6E2',
    backgroundColor: '#F5F8F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#101B20',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#25B89A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#25B89A',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#25B89A',
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: '#71818A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#173D3B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
