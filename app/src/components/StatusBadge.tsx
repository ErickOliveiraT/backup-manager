import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { StatusEntry } from '../types';

const badgeConfig = {
  healthy: { bg: '#166534', text: colors.greenLight, label: 'Healthy' },
  warning: { bg: '#713f12', text: colors.yellowLight, label: 'Warning' },
  critical: { bg: '#7f1d1d', text: colors.redLight, label: 'Critical' },
} as const;

export function StatusBadge({ status }: { status: StatusEntry['status'] }) {
  const cfg = badgeConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
