import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  healthy: number;
  warning: number;
  critical: number;
}

const SIZE = 120;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function arc(offset: number, pct: number, color: string) {
  if (pct <= 0) return null;
  const dash = pct * CIRCUMFERENCE;
  return (
    <Circle
      key={color}
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
      strokeDashoffset={-offset * CIRCUMFERENCE}
      strokeLinecap="butt"
      rotation="-90"
      origin={`${SIZE / 2}, ${SIZE / 2}`}
    />
  );
}

export function DonutChart({ healthy, warning, critical }: Props) {
  const total = healthy + warning + critical;
  if (total === 0) return null;

  const h = healthy / total;
  const w = warning / total;
  const c = critical / total;

  return (
    <View style={styles.wrap}>
      <View style={styles.chartRow}>
        <View style={styles.svgWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={colors.bgTertiary} strokeWidth={STROKE} />
            {arc(0, h, colors.success)}
            {arc(h, w, colors.warning)}
            {arc(h + w, c, colors.critical)}
          </Svg>
          <View style={styles.center}>
            <Text style={styles.total}>{total}</Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {[
            { label: 'Healthy', count: healthy, color: colors.success },
            { label: 'Warning', count: warning, color: colors.warning },
            { label: 'Critical', count: critical, color: colors.critical },
          ].map(({ label, count, color }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{label}</Text>
              <Text style={styles.legendCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  svgWrap: {
    position: 'relative',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  total: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  legend: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  legendCount: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
