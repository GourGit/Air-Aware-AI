import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { communityApi, handleApiError } from '../services/api';
import { useMobileAuthStore } from '../store/authStore';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  delhi: { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
};

const VALID_CATEGORIES = ['smoke', 'dust', 'waste_burning', 'traffic', 'industrial', 'other'] as const;

function resolveLocationCoordinates(address: string): { lat: number; lng: number } {
  const lower = address.toLowerCase();
  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    if (lower.includes(cityName)) {
      return coords;
    }
  }
  return { lat: 20.5937, lng: 78.9629 };
}

interface QueuedReport {
  id: string;
  category: string;
  locationName: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: string;
  status: 'pending' | 'submitted' | 'failed';
}

const OFFLINE_QUEUE_KEY = 'airaware_offline_reports';

export default function CommunityScreen() {
  const user = useMobileAuthStore((state) => state.user);
  const [category, setCategory] = useState('waste_burning');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedReport[]>([]);

  useEffect(() => {
    loadOfflineQueue();
  }, []);

  const loadOfflineQueue = async () => {
    try {
      const stored = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to load offline queue:', err);
    }
  };

  const saveOfflineQueue = async (queue: QueuedReport[]) => {
    try {
      await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('Failed to save offline queue:', err);
    }
  };

  const validateForm = (): boolean => {
    if (!locationName.trim() || !description.trim()) {
      setError('Please enter a location and brief description.');
      return false;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return false;
    }
    if (description.trim().length > 1000) {
      setError('Description must be 1000 characters or less.');
      return false;
    }
    if (locationName.trim().length < 2) {
      setError('Location name must be at least 2 characters.');
      return false;
    }
    if (locationName.trim().length > 255) {
      setError('Location name must be 255 characters or less.');
      return false;
    }
    const coords = resolveLocationCoordinates(locationName);
    if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) {
      setError('Invalid coordinates resolved from location.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setError(null);
    setLoading(true);

    const coords = resolveLocationCoordinates(locationName);
    const reportPayload = {
      category,
      description: description.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      approx_location_name: locationName.trim(),
      observed_at: new Date().toISOString(),
    };

    try {
      await communityApi.submitReport(reportPayload);
      setSubmitted(true);
    } catch (err) {
      console.warn('Live reporting server unavailable; saving to durable offline queue:', err);
      const apiError = handleApiError(err);
      const queuedItem: QueuedReport = {
        id: `offline-${Date.now()}`,
        category,
        locationName: locationName.trim(),
        description: description.trim(),
        lat: coords.lat,
        lng: coords.lng,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
      };
      const newQueue = [...offlineQueue, queuedItem];
      setOfflineQueue(newQueue);
      await saveOfflineQueue(newQueue);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCurrentFormOnly = () => {
    setSubmitted(false);
    setLocationName('');
    setDescription('');
    setError(null);
  };

  const handleRetryOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    setLoading(true);
    const newQueue = [...offlineQueue];

    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      if (item.status === 'submitted') continue;

      try {
        await communityApi.submitReport({
          category: item.category,
          description: item.description,
          latitude: item.lat,
          longitude: item.lng,
          approx_location_name: item.locationName,
          observed_at: new Date().toISOString(),
        });
        newQueue[i] = { ...item, status: 'submitted' };
      } catch (err) {
        newQueue[i] = { ...item, status: 'failed' };
        console.warn('Failed to sync offline report:', err);
      }
    }

    setOfflineQueue(newQueue);
    await saveOfflineQueue(newQueue);
    setLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    waste_burning: 'Waste Burning',
    smoke: 'Smoke / Fumes',
    dust: 'Construction Dust',
    traffic: 'Heavy Vehicle Smog',
    industrial: 'Industrial Emissions',
    other: 'Other',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Pollution Reporting</Text>
        <Text style={styles.subtitle}>Report localized smoke, dust, and burning to civic authorities</Text>
      </View>

      {offlineQueue.length > 0 && (
        <View style={styles.queueNotice}>
          <View style={styles.queueNoticeHeader}>
            <Text style={styles.queueNoticeTitle}>
              Durable Offline Storage: {offlineQueue.filter((r) => r.status === 'pending').length} pending, {offlineQueue.filter((r) => r.status === 'submitted').length} synced
            </Text>
            <TouchableOpacity style={styles.retrySyncBtn} onPress={handleRetryOfflineQueue} disabled={loading}>
              <Text style={styles.retrySyncBtnText}>Retry Sync</Text>
            </TouchableOpacity>
          </View>
          {offlineQueue.slice(-3).map((item) => (
            <View key={item.id} style={styles.queueItem}>
              <Text style={[styles.queueItemType, item.status === 'failed' && styles.queueItemFailed]}>
                {categoryLabels[item.category] || item.category} at {item.locationName}
              </Text>
              <Text style={[styles.queueItemStatus, item.status === 'pending' && styles.queueItemPending, item.status === 'submitted' && styles.queueItemSynced, item.status === 'failed' && styles.queueItemFailed]}>
                {item.status === 'pending' ? 'Pending sync' : item.status === 'submitted' ? 'Synced' : 'Failed'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {submitted ? (
        <View style={[styles.successCard]}>
          <Text style={styles.successTitle}>Report Submitted Successfully</Text>
          <Text style={styles.successText}>
            Thank you for your civic vigilance. Your report has been submitted to the moderation stream.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleClearCurrentFormOnly}>
            <Text style={styles.resetBtnText}>Submit Another Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Pollution Source Type:</Text>
          <View style={styles.typeRow}>
            {VALID_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.typePill, category === c && styles.typePillActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.typeText, category === c && styles.typeTextActive]}>
                  {categoryLabels[c] || c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location / Landmark / City:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bandra Kurla Complex, Mumbai or Anand Vihar, Delhi"
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

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Civic Report</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

import * as SecureStore from 'expo-secure-store';

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
  queueNotice: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  queueNoticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueNoticeTitle: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  retrySyncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  retrySyncBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  queueItemType: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  queueItemFailed: {
    color: '#DC2626',
  },
  queueItemStatus: {
    fontSize: 10,
    color: '#3B82F6',
  },
  queueItemPending: {
    color: '#F59E0B',
  },
  queueItemSynced: {
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
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
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