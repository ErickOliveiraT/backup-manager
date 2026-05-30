import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { isAuthenticated } from '../src/services/auth';
import { colors } from '../src/theme';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    isAuthenticated().then((authed) => {
      const inAuth = segments[0] === 'login';
      if (!authed && !inAuth) {
        router.replace('/login');
      } else if (authed && inAuth) {
        router.replace('/(tabs)/');
      }
      setChecked(true);
    });
  }, [segments]);

  if (!checked) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
  }

  return <Slot />;
}
