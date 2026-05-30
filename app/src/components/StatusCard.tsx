import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, statusColor } from '../theme';
import { StatusBadge } from './StatusBadge';
import type { StatusEntry } from '../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function StatusCard({ entry }: { entry: StatusEntry }) {
  const color = statusColor[entry.status];
  const time = entry.last_event?.timestamp ? timeAgo(entry.last_event.timestamp) : '—';

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <Text style={styles.device} numberOfLines={1}>{entry.device_id}</Text>
        <StatusBadge status={entry.status} />
      </View>
      <Text style={styles.task} numberOfLines={1}>{entry.task}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{time}</Text>
        <Text style={styles.meta}>{entry.event_count} events</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  device: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  task: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
