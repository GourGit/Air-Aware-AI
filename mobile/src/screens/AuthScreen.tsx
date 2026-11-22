import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../config/api';
import { useMobileAuthStore } from '../store/authStore';

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const setAuth = useMobileAuthStore((state) => state.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email: email.trim(), password, full_name: name.trim() }
        : { email: email.trim(), password };

      const res = await api.post(endpoint, payload);
      const token = res.data.access_token || res.data.data?.access_token || 'authenticated-token';
      const user = res.data.user || res.data.data?.user || {
        id: 'usr-1',
        email: email.trim(),
        name: isRegister ? name.trim() : email.split('@')[0],
      };

      setAuth(user, token);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.warn('Auth request failed:', err);
      let errorMsg = 'Authentication failed. Please verify credentials.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d.detail === 'string') {
          errorMsg = d.detail;
        } else if (Array.isArray(d.detail)) {
          errorMsg = d.detail.map((item: any) => item.msg || JSON.stringify(item)).join('; ');
        } else if (typeof d.message === 'string') {
          errorMsg = d.message;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemoMode = () => {
    const demoUser = {
      id: 'usr-demo-mode',
      email: 'aarav.sharma@example.com',
      name: 'Aarav Sharma',
    };
    setAuth(demoUser, 'demo-session-token');
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
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isRegister && (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aarav Sharma"
            />
          </>
        )}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnText}>{isRegister ? 'Complete Onboarding' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
        >
          <Text style={styles.switchText}>
            {isRegister ? 'Already registered? Sign In' : 'New to AirAware? Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>DEMO EVALUATION</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.demoBtn} onPress={handleLaunchDemoMode}>
          <Text style={styles.demoBtnText}>Launch Offline Demonstration Mode</Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE6E2',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71818A',
  },
  demoBtn: {
    borderWidth: 1,
    borderColor: '#25B89A',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#25B89A',
    fontSize: 12,
    fontWeight: '700',
  },
});
