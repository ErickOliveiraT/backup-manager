import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Bell, Copy, Eye, EyeOff, Key, Lock, LogOut, RefreshCw, Shield } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { changePassword, getMe, regenerateApiKey, updateNotificationPreference } from '../../src/services/api';
import { clearToken } from '../../src/services/auth';
import { colors } from '../../src/theme';
import type { User } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [showKey, setShowKey] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [notifPref, setNotifPref] = useState<User['notification_preference']>('none');
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setNotifPref(u.notification_preference ?? 'none');
    }).finally(() => setLoading(false));
  }, []);

  async function handleCopy() {
    if (!user?.api_key) return;
    await Clipboard.setStringAsync(user.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegen() {
    if (!confirmRegen) { setConfirmRegen(true); return; }
    setRegenerating(true);
    try {
      const key = await regenerateApiKey();
      setUser((u) => u ? { ...u, api_key: key } : u);
      setConfirmRegen(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleChangePassword() {
    setPwError('');
    setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwError(e.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  }

  async function handleSaveNotifPref() {
    setSavingNotif(true);
    setNotifMsg('');
    try {
      await updateNotificationPreference(notifPref);
      setNotifMsg('Preference saved');
    } catch {
      setNotifMsg('Failed to save preference');
    } finally {
      setSavingNotif(false);
    }
  }

  async function handleLogout() {
    await clearToken();
    router.replace('/login');
  }

  const maskedKey = user?.api_key
    ? (showKey ? user.api_key : '••••••••••••••••' + user.api_key.slice(-8))
    : '—';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Profile & API Key */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Shield size={18} color={colors.blueLight} />
              <Text style={styles.cardTitle}>Profile & API Key</Text>
            </View>

            <View style={styles.row}><Text style={styles.rowLabel}>Name</Text><Text style={styles.rowValue}>{user?.name}</Text></View>
            <View style={[styles.row, styles.rowBorder]}><Text style={styles.rowLabel}>Username</Text><Text style={[styles.rowValue, styles.mono]}>{user?.username}</Text></View>

            <View style={styles.keySection}>
              <View style={styles.keyRow}>
                <Key size={14} color={colors.blueLight} />
                <Text style={styles.rowLabel}>API Key</Text>
              </View>
              <Text style={[styles.keyValue, !showKey && styles.keyMasked]}>{maskedKey}</Text>
              <View style={styles.keyActions}>
                <Pressable style={styles.keyBtn} onPress={() => setShowKey((v) => !v)}>
                  {showKey ? <EyeOff size={15} color={colors.textSecondary} /> : <Eye size={15} color={colors.textSecondary} />}
                  <Text style={styles.keyBtnText}>{showKey ? 'Hide' : 'Show'}</Text>
                </Pressable>
                <Pressable style={styles.keyBtn} onPress={handleCopy}>
                  <Copy size={15} color={copied ? colors.greenLight : colors.textSecondary} />
                  <Text style={[styles.keyBtnText, copied && { color: colors.greenLight }]}>{copied ? 'Copied!' : 'Copy'}</Text>
                </Pressable>
                <Pressable style={[styles.keyBtn, confirmRegen && styles.keyBtnDanger]} onPress={handleRegen} disabled={regenerating}>
                  {regenerating ? (
                    <ActivityIndicator size="small" color={colors.warning} />
                  ) : (
                    <RefreshCw size={15} color={confirmRegen ? colors.warning : colors.textSecondary} />
                  )}
                  <Text style={[styles.keyBtnText, confirmRegen && { color: colors.warning }]}>
                    {confirmRegen ? 'Confirm?' : 'Regenerate'}
                  </Text>
                </Pressable>
                {confirmRegen && (
                  <Pressable style={styles.keyBtn} onPress={() => setConfirmRegen(false)}>
                    <Text style={styles.keyBtnText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
              {confirmRegen && (
                <Text style={styles.regenWarning}>This will invalidate the current key.</Text>
              )}
            </View>
          </View>

          {/* Push Notifications */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={18} color={colors.blueLight} />
              <Text style={styles.cardTitle}>Push Notifications</Text>
            </View>
            {(['none', 'warning_and_critical', 'critical_only'] as const).map((opt) => {
              const labels = {
                none: 'Disabled',
                warning_and_critical: 'Critical & Warning',
                critical_only: 'Critical only',
              };
              const active = notifPref === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setNotifPref(opt)}
                  style={[styles.prefOption, active && styles.prefOptionActive]}
                >
                  <Text style={[styles.prefOptionText, active && styles.prefOptionTextActive]}>
                    {labels[opt]}
                  </Text>
                </Pressable>
              );
            })}
            {notifMsg ? <Text style={notifMsg === 'Preference saved' ? styles.successText : styles.errorText}>{notifMsg}</Text> : null}
            <Pressable
              style={[styles.submitBtn, savingNotif && styles.btnDisabled]}
              onPress={handleSaveNotifPref}
              disabled={savingNotif}
            >
              {savingNotif
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Save</Text>}
            </Pressable>
          </View>

          {/* Change Password */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lock size={18} color={colors.blueLight} />
              <Text style={styles.cardTitle}>Change Password</Text>
            </View>

            <Text style={styles.label}>Current Password</Text>
            <View style={styles.pwWrap}>
              <TextInput
                style={[styles.input, styles.pwInput]}
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!showCurrentPw}
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowCurrentPw((v) => !v)}>
                {showCurrentPw ? <EyeOff size={16} color={colors.textSecondary} /> : <Eye size={16} color={colors.textSecondary} />}
              </Pressable>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.pwWrap}>
              <TextInput
                style={[styles.input, styles.pwInput]}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showNewPw}
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowNewPw((v) => !v)}>
                {showNewPw ? <EyeOff size={16} color={colors.textSecondary} /> : <Eye size={16} color={colors.textSecondary} />}
              </Pressable>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}
            {pwSuccess ? <Text style={styles.successText}>{pwSuccess}</Text> : null}

            <Pressable
              style={[styles.submitBtn, (!currentPw || !newPw || !confirmPw) && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={!currentPw || !newPw || !confirmPw || changingPw}
            >
              {changingPw ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Change Password</Text>}
            </Pressable>
          </View>

          {/* Logout */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color={colors.critical} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  mono: { fontFamily: 'monospace' },
  keySection: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  keyValue: { color: colors.textPrimary, fontSize: 13, fontFamily: 'monospace', marginBottom: 10 },
  keyMasked: { letterSpacing: 2 },
  keyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgTertiary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  keyBtnDanger: { borderWidth: 1, borderColor: colors.warning + '60' },
  keyBtnText: { color: colors.textSecondary, fontSize: 12 },
  regenWarning: { color: colors.yellowLight, fontSize: 11, marginTop: 8 },
  label: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  pwWrap: { position: 'relative', marginBottom: 12 },
  pwInput: { marginBottom: 0, paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 12 },
  errorText: { color: colors.redLight, fontSize: 12, marginBottom: 8 },
  successText: { color: colors.greenLight, fontSize: 12, marginBottom: 8 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  prefOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  prefOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  prefOptionText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  prefOptionTextActive: {
    color: colors.blueLight,
    fontWeight: '600' as const,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutText: { color: colors.critical, fontSize: 14, fontWeight: '600' },
});
