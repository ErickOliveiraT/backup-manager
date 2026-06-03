import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { isAuthenticated } from '../src/services/auth';
import { postFcmToken } from '../src/services/api';
import { colors } from '../src/theme';

async function registerForPushNotifications() {
  // expo-notifications throws in Expo Go (executionEnvironment === 'storeClient')
  // because the native push module is absent there.
  if (Constants.executionEnvironment === 'storeClient') return;
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = await Notifications.getDevicePushTokenAsync();
    await postFcmToken(token.data).catch(() => {});
  } catch {
    // silently skip
  }
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);
  const notifRegistered = useRef(false);

  useEffect(() => {
    isAuthenticated().then((authed) => {
      const inAuth = segments[0] === 'login';
      if (!authed && !inAuth) {
        router.replace('/login');
        notifRegistered.current = false;
      } else if (authed && inAuth) {
        router.replace('/(tabs)/');
      } else if (authed && !inAuth && !notifRegistered.current) {
        notifRegistered.current = true;
        registerForPushNotifications();
      }
      setChecked(true);
    });
  }, [segments]);

  if (!checked) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return <Slot />;
}
