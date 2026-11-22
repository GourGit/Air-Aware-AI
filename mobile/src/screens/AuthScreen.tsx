import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@airaware.ai');
  const [password, setPassword] = useState('AirAwarePass123!');
  const [name, setName] = useState('Basak');

  const handleSubmit = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoText}>AA</Text>
      </View>
      <Text style={styles.title}>AirAware AI Mobile</Text>
      <Text style={styles.subtitle}>
        {isRegister ? 'Personalized Lifestyle Air Intelligence' : 'Sign in to access your AI companion'}
      </Text>

      <View style={styles.card}>
        {isRegister && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </>
        )}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
          <Text style={styles.btnText}>{isRegister ? 'Complete Onboarding' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchRow} onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.switchText}>
            {isRegister
              ? 'Already registered? Sign In'
              : 'New to AirAware? Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F7',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#25B89A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#101B20',
  },
  subtitle: {
    fontSize: 13,
    color: '#71818A',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE6E2',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101B20',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6E2',
    backgroundColor: '#F5F8F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#101B20',
  },
  btn: {
    backgroundColor: '#25B89A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  switchRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25B89A',
  },
});
