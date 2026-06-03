import { useRouter } from 'expo-router';
import { Shield, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login } from '../src/services/api';
import { setToken } from '../src/services/auth';
import { colors } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const token = await login(username, password);
      await setToken(token);
      router.replace('/(tabs)/');
    } catch (err: any) {
      console.error('[login error]', err?.message ?? err);
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Shield size={28} color={colors.blueLight} />
        </View>
        <Text style={styles.title}>Backup Manager</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            {showPassword ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (loading || !username || !password) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading || !username || !password}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'stretch',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 2,
  },
  error: {
    color: colors.redLight,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
