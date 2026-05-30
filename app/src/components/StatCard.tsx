import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { LucideIcon } from 'lucide-react-native';

interface Props {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
}

export function StatCard({ Icon, label, value, iconColor, iconBg }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: 100,
    marginRight: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});
