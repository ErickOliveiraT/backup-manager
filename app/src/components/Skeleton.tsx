import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

function SkeletonBox({ width, height, style }: { width?: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width ?? '100%', height, opacity },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={120} height={13} />
        <SkeletonBox width={60} height={18} />
      </View>
      <SkeletonBox width={180} height={11} style={{ marginTop: 6 }} />
      <View style={styles.cardFooter}>
        <SkeletonBox width={60} height={10} />
        <SkeletonBox width={60} height={10} />
      </View>
    </View>
  );
}

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={16} height={16} style={{ borderRadius: 8, marginRight: 10 }} />
      <SkeletonBox height={13} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bgTertiary,
    borderRadius: 6,
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
