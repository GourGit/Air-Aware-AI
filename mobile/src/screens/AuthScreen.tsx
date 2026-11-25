import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { authApi, handleApiError } from '../services/api';
import { useMobileAuthStore } from '../store/authStore';

export default function AuthScreen({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const setAuth = useMobileAuthStore((state) => state.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const restore = async () => {
      await useMobileAuthStore.getState().restoreSession();
      if (useMobileAuthStore.getState().isAuthenticated && onAuthSuccess) {
        onAuthSuccess();
      }
    };
    restore();
  }, [onAuthSuccess]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (isRegister) {
      if (!displayName.trim()) {
        setError('Please provide your full name.');
        return;
      }
      if (displayName.trim().length > 100) {
        setError('Name must be 100 characters or less.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password.length > 128) {
        setError('Password must be 128 characters or less.');
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await authApi.register({
          email: email.trim(),
          password,
          display_name: displayName.trim(),
        });
        Alert.alert(
          'Account Created',
          'Your account has been created successfully. Please sign in to continue.',
          [{ text: 'OK', onPress: () => setIsRegister(false) }]
        );
      } else {
        const { accessToken, refreshToken } = await authApi.login({
          email: email.trim(),
          password,
        });
        const user = await authApi.me();
        await setAuth(
          { id: user.id, email: user.email, name: user.display_name || user.email.split('@')[0] },
          accessToken,
          refreshToken
        );
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDemoMode = () => {
    const demoUser = {
      id: 'usr-demo-mode',
      email: 'demo@airaware.ai',
      name: 'Demo User',
    };
    setAuth(demoUser, 'demo-access-token', 'demo-refresh-token');
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoText}>AA</Text>
      </View>
      <Text style={styles.title}>AirAware AI Mobile</Text>
      <Text style={styles.subtitle}>
        {isRegister ? 'Create your personalized air intelligence account' : 'Sign in to access your AI companion'}
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
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Aarav Sharma"
              autoCapitalize="words"
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
          placeholder={isRegister ? 'Min. 8 characters' : '••••••••'}
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnText}>{isRegister ? 'Create Account' : 'Sign In'}</Text>
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