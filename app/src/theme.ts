export const colors = {
  bgPrimary: '#0f1117',
  bgSecondary: '#1a1f2e',
  bgTertiary: '#2a3040',
  textPrimary: '#f3f4f6',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  border: '#2a3040',
  success: '#22c55e',
  warning: '#eab308',
  critical: '#ef4444',
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  secondary: '#4f46e5',
  secondaryHover: '#4338ca',
  blueLight: '#60a5fa',
  greenLight: '#4ade80',
  yellowLight: '#facc15',
  redLight: '#f87171',
} as const;

export type StatusColor = 'healthy' | 'warning' | 'critical';

export const statusColor: Record<StatusColor, string> = {
  healthy: colors.success,
  warning: colors.warning,
  critical: colors.critical,
};
