import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { mobilityApi, handleApiError } from '../services/api';
import { useMobileAuthStore } from '../store/authStore';

export default function MobilityScreen() {
  const [distance, setDistance] = useState('12');
  const [origin, setOrigin] = useState('Current Location');
  const [destination, setDestination] = useState('City Center');
  const [passengers, setPassengers] = useState('1');
  const [comparisons, setComparisons] = useState<MobilityComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useMobileAuthStore((state) => state.user);

  interface MobilityComparison {
    mode: string;
    mode_name: string;
    distance_km: number;
    travel_time_est_mins: number;
    co2e_emissions_kg: number;
    co2e_saved_vs_car_kg: number;
    health_exposure_rating: string;
    caloric_burn_kcal: number;
  }

  const parsedDist = parseFloat(distance.trim());
  const parsedPassengers = parseInt(passengers.trim(), 10);
  const isValid = !isNaN(parsedDist) && isFinite(parsedDist) && parsedDist >= 0 && parsedPassengers > 0;

  const handleCompare = async () => {
    if (!isValid) {
      setError('Please enter valid distance and passenger count.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await mobilityApi.compareModes({
        distance_km: parsedDist,
        origin: origin.trim(),
        destination: destination.trim(),
        passengers: parsedPassengers,
      });
      setComparisons(res.comparisons);
    } catch (err) {
      console.warn('Mobility comparison failed:', err);
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogTrip = async (mode: string, emissionsKg: number, savedKg: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to log trips and track your impact.');
      return;
    }

    try {
      await mobilityApi.logTrip({
        origin: origin.trim(),
        destination: destination.trim(),
        distance_km: parsedDist,
        mode_chosen: mode,
        mode_baseline: 'private_car_petrol',
        duration_minutes: comparisons.find(c => c.mode === mode)?.travel_time_est_mins,
        trip_date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Trip Logged', 'Your sustainable trip has been recorded!');
    } catch (err) {
      console.warn('Failed to log trip:', err);
      const apiError = handleApiError(err);
      Alert.alert('Error', apiError.message);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sustainable Mobility Advisor</Text>
        <Text style={styles.subtitle}>
          Compare travel emissions & personal pollution exposure (ARAI/CEA factors)
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Trip Distance (km):</Text>
        <TextInput
          style={[styles.input, !isValid && styles.inputError]}
          keyboardType="numeric"
          value={distance}
          onChangeText={setDistance}
          placeholder="Enter distance (e.g. 12)"
        />

        <Text style={styles.inputLabel}>Passengers:</Text>
        <TextInput
          style={[styles.input, !isValid && styles.inputError]}
          keyboardType="numeric"
          value={passengers}
          onChangeText={setPassengers}
          placeholder="Number of passengers (default: 1)"
        />

        <Text style={styles.inputLabel}>From:</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="e.g. Anand Vihar"
        />

        <Text style={styles.inputLabel}>To:</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Connaught Place"
        />

        {!isValid && (
          <Text style={styles.errorText}>
            Please enter a valid, non-negative numerical distance in kilometers.
          </Text>
        )}

        <TouchableOpacity style={styles.compareBtn} onPress={handleCompare} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.compareBtnText}>Compare Transport Modes</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.modeList}>
        {isValid ? (
          comparisons.length > 0 ? (
            comparisons.map((m, idx) => (
              <TouchableOpacity key={idx} style={styles.modeCard} onPress={() => handleLogTrip(m.mode, m.co2e_emissions_kg, m.co2e_saved_vs_car_kg)} activeOpacity={0.8}>
                <View style={styles.modeHeader}>
                  <Text style={styles.modeName}>{m.mode_name}</Text>
                  <Text style={styles.emissionsNum}>
                    {m.co2e_emissions_kg.toFixed(3)} kg CO₂e
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Travel Time:</Text>
                  <Text style={styles.detailValue}>{m.travel_time_est_mins} min</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Air Exposure Risk:</Text>
                  <Text style={styles.detailValue}>{m.health_exposure_rating}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CO₂e Saved vs Private Car:</Text>
                  <Text style={styles.savingsValue}>
                    {m.co2e_saved_vs_car_kg.toFixed(3)} kg avoided
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Calories Burned:</Text>
                  <Text style={styles.detailValue}>{m.caloric_burn_kcal} kcal</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                Tap "Compare Transport Modes" to calculate emissions for your trip.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Enter a valid distance and passenger count above to calculate and display transit emissions.
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
    marginTop: 10,
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
  compareBtn: {
    backgroundColor: '#25B89A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  compareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
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
    color: '#25B89A',
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