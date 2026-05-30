import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ListChecks,
  Monitor,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';
import { getDevices, getEvents, getStatus } from '../../src/services/api';
import { CardSkeleton } from '../../src/components/Skeleton';
import { StatCard } from '../../src/components/StatCard';
import { StatusCard } from '../../src/components/StatusCard';
import { DonutChart } from '../../src/components/DonutChart';
import { colors } from '../../src/theme';
import type { BackupEvent, Device, StatusEntry } from '../../src/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardScreen() {
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [recentEvents, setRecentEvents] = useState<BackupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [deviceFilter, setDeviceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d, e] = await Promise.all([
        getStatus(),
        getDevices(1, 100),
        getEvents({ limit: 10 }),
      ]);
      setStatuses(s);
      setDevices(d.data);
      setRecentEvents(e.data);
    } catch {}
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const healthy = statuses.filter((s) => s.status === 'healthy').length;
  const warning = statuses.filter((s) => s.status === 'warning').length;
  const critical = statuses.filter((s) => s.status === 'critical').length;
  const lastBackup = statuses.reduce<string>((acc, s) => {
    const t = s.last_event?.timestamp ?? '';
    return t > acc ? t : acc;
  }, '');

  const filtered = statuses.filter((s) => {
    if (deviceFilter && s.device_id !== deviceFilter) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const statusOptions = ['', 'healthy', 'warning', 'critical'] as const;

  return (
    <FlatList
      style={styles.root}
      data={filtered}
      keyExtractor={(item) => `${item.device_id}:${item.task}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <>
          {/* Stats row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
            <StatCard Icon={Monitor} label="Devices" value={devices.length} iconColor={colors.blueLight} iconBg="rgba(59,130,246,0.12)" />
            <StatCard Icon={ListChecks} label="Tasks" value={statuses.length} iconColor={colors.blueLight} iconBg="rgba(59,130,246,0.12)" />
            <StatCard Icon={CheckCircle} label="Healthy" value={healthy} iconColor={colors.success} iconBg="rgba(34,197,94,0.12)" />
            <StatCard Icon={AlertTriangle} label="Warning" value={warning} iconColor={colors.warning} iconBg="rgba(234,179,8,0.12)" />
            <StatCard Icon={XCircle} label="Critical" value={critical} iconColor={colors.critical} iconBg="rgba(239,68,68,0.12)" />
            <StatCard Icon={Clock} label="Last backup" value={lastBackup ? timeAgo(lastBackup) : '—'} iconColor={colors.blueLight} iconBg="rgba(59,130,246,0.12)" />
          </ScrollView>

          {/* Filters */}
          <View style={styles.filterRow}>
            <Pressable style={styles.filterBtn} onPress={() => setDevicePickerOpen(true)}>
              <Monitor size={13} color={colors.textSecondary} />
              <Text style={styles.filterText} numberOfLines={1}>
                {deviceFilter || 'All devices'}
              </Text>
            </Pressable>
            <Pressable style={styles.filterBtn} onPress={() => setStatusPickerOpen(true)}>
              <Text style={styles.filterText}>{statusFilter || 'All statuses'}</Text>
            </Pressable>
            {(deviceFilter || statusFilter) && (
              <Pressable onPress={() => { setDeviceFilter(''); setStatusFilter(''); }}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {loading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </>
          )}
        </>
      }
      ListFooterComponent={
        !loading ? (
          <>
            {/* Donut chart */}
            {statuses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status Distribution</Text>
                <DonutChart healthy={healthy} warning={warning} critical={critical} />
              </View>
            )}

            {/* Recent events */}
            {recentEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Events</Text>
                <View style={styles.eventList}>
                  {recentEvents.map((ev) => (
                    <View key={ev.id} style={styles.eventRow}>
                      {ev.status === 'success' ? (
                        <CheckCircle size={16} color={colors.greenLight} />
                      ) : (
                        <XCircle size={16} color={colors.redLight} />
                      )}
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventDevice}>{ev.device_id}</Text>
                        <Text style={styles.eventTask}>{ev.task}</Text>
                      </View>
                      <Text style={styles.eventTime}>{timeAgo(ev.timestamp)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null
      }
      renderItem={({ item }) => loading ? null : <StatusCard entry={item} />}
    >
      {/* Device picker modal */}
      <Modal visible={devicePickerOpen} transparent animationType="fade" onRequestClose={() => setDevicePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDevicePickerOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Device</Text>
            {[{ id: '', name: 'All devices' }, ...devices].map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.pickerItem, deviceFilter === d.id && styles.pickerItemActive]}
                onPress={() => { setDeviceFilter(d.id); setDevicePickerOpen(false); }}
              >
                <Text style={[styles.pickerItemText, deviceFilter === d.id && styles.pickerItemTextActive]}>
                  {d.name || d.id || 'All devices'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Status picker modal */}
      <Modal visible={statusPickerOpen} transparent animationType="fade" onRequestClose={() => setStatusPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStatusPickerOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Status</Text>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pickerItem, statusFilter === s && styles.pickerItemActive]}
                onPress={() => { setStatusFilter(s); setStatusPickerOpen(false); }}
              >
                <Text style={[styles.pickerItemText, statusFilter === s && styles.pickerItemTextActive]}>
                  {s || 'All statuses'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </FlatList>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 32 },
  statsRow: { marginBottom: 12 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: 140,
  },
  filterText: { color: colors.textSecondary, fontSize: 12 },
  clearText: { color: colors.blueLight, fontSize: 12 },
  section: { marginTop: 16 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  eventList: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventInfo: { flex: 1 },
  eventDevice: { color: colors.textPrimary, fontSize: 12, fontWeight: '500' },
  eventTask: { color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  eventTime: { color: colors.textMuted, fontSize: 11 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  pickerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  pickerItemActive: { backgroundColor: colors.primary + '22' },
  pickerItemText: { color: colors.textSecondary, fontSize: 14 },
  pickerItemTextActive: { color: colors.blueLight, fontWeight: '600' },
});
