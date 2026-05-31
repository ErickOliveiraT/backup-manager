import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CheckCircle, XCircle, Trash2, X, Calendar } from 'lucide-react-native';
import { deleteEvent, getDevices, getEvents } from '../../src/services/api';
import { RowSkeleton } from '../../src/components/Skeleton';
import { colors } from '../../src/theme';
import type { BackupEvent, Device } from '../../src/types';

type StatusFilter = '' | 'success' | 'error';

export default function EventsScreen() {
  const [events, setEvents] = useState<BackupEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const load = useCallback(async (p = 1) => {
    try {
      const [res, devs] = await Promise.all([
        getEvents({
          status: statusFilter || undefined,
          device_id: deviceFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page: p,
          limit: 20,
        }),
        getDevices(1, 100),
      ]);
      setEvents(res.data);
      setTotal(res.total);
      setPages(res.pages);
      setDevices(devs.data);
    } catch {}
  }, [statusFilter, deviceFilter, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    load(1).finally(() => setLoading(false));
  }, [statusFilter, deviceFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (page > 1) load(page);
  }, [page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(page);
    setRefreshing(false);
  }, [load, page]);

  async function handleDelete(id: string) {
    Alert.alert('Delete Event', 'Delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(id);
            setEvents((prev) => prev.filter((e) => e.id !== id));
            setTotal((n) => n - 1);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  const hasFilters = statusFilter || deviceFilter || dateFrom || dateTo;

  function openDatePicker(target: 'from' | 'to') {
    const existing = target === 'from' ? dateFrom : dateTo;
    setTempDate(existing ? new Date(existing) : new Date());
    setDatePickerTarget(target);
  }

  function onDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setDatePickerTarget(null);
      if (event.type === 'set' && selected) {
        const iso = selected.toISOString().slice(0, 10);
        datePickerTarget === 'from' ? setDateFrom(iso) : setDateTo(iso);
      }
    } else {
      if (selected) setTempDate(selected);
    }
  }

  function confirmIOSDate() {
    const iso = tempDate.toISOString().slice(0, 10);
    datePickerTarget === 'from' ? setDateFrom(iso) : setDateTo(iso);
    setDatePickerTarget(null);
  }

  function formatDateLabel(iso: string) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatTs(ts: string) {
    try {
      return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return ts;
    }
  }

  return (
    <View style={styles.root}>
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        <Pressable style={styles.filterBtn} onPress={() => setStatusPickerOpen(true)}>
          <Text style={styles.filterText} numberOfLines={1}>{statusFilter || 'All statuses'}</Text>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => setDevicePickerOpen(true)}>
          <Text style={styles.filterText} numberOfLines={1}>{deviceFilter || 'All devices'}</Text>
        </Pressable>
        <Pressable style={[styles.filterBtn, styles.dateBtn]} onPress={() => openDatePicker('from')}>
          <Calendar size={12} color={dateFrom ? colors.blueLight : colors.textMuted} />
          <Text style={[styles.filterText, dateFrom && styles.dateActive]} numberOfLines={1}>
            {dateFrom ? formatDateLabel(dateFrom) : 'From'}
          </Text>
        </Pressable>
        <Pressable style={[styles.filterBtn, styles.dateBtn]} onPress={() => openDatePicker('to')}>
          <Calendar size={12} color={dateTo ? colors.blueLight : colors.textMuted} />
          <Text style={[styles.filterText, dateTo && styles.dateActive]} numberOfLines={1}>
            {dateTo ? formatDateLabel(dateTo) : 'To'}
          </Text>
        </Pressable>
        {hasFilters ? (
          <Pressable style={styles.clearBtn} onPress={() => { setStatusFilter(''); setDeviceFilter(''); setDateFrom(''); setDateTo(''); }}>
            <X size={12} color={colors.blueLight} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Text style={styles.totalText}>{total} events</Text>

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item: ev }) => (
            <View style={styles.row}>
              {ev.status === 'success' ? (
                <CheckCircle size={16} color={colors.greenLight} />
              ) : (
                <XCircle size={16} color={colors.redLight} />
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.rowDevice}>{ev.device_id}</Text>
                <Text style={styles.rowTask}>{ev.task}</Text>
                <Text style={styles.rowMeta}>{ev.source}  ·  {formatTs(ev.timestamp)}</Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={() => handleDelete(ev.id)}>
                <Trash2 size={14} color={colors.critical} />
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            pages > 1 ? (
              <View style={styles.pagination}>
                <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)} style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}>
                  <Text style={styles.pageBtnText}>‹</Text>
                </Pressable>
                <Text style={styles.pageInfo}>{page} / {pages}</Text>
                <Pressable disabled={page >= pages} onPress={() => setPage((p) => p + 1)} style={[styles.pageBtn, page >= pages && styles.pageBtnDisabled]}>
                  <Text style={styles.pageBtnText}>›</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      {/* Status picker */}
      <Modal visible={statusPickerOpen} transparent animationType="fade" onRequestClose={() => setStatusPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setStatusPickerOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Filter by Status</Text>
            {(['', 'success', 'error'] as StatusFilter[]).map((s) => (
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

      {/* Date picker — Android renders natively as dialog, iOS uses modal */}
      {datePickerTarget !== null && Platform.OS === 'android' && (
        <DateTimePicker
          mode="date"
          value={tempDate}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      {datePickerTarget !== null && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setDatePickerTarget(null)}>
          <Pressable style={styles.backdrop} onPress={() => setDatePickerTarget(null)}>
            <Pressable style={styles.iosPickerCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.pickerTitle}>
                {datePickerTarget === 'from' ? 'From date' : 'To date'}
              </Text>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={tempDate}
                onChange={onDateChange}
                maximumDate={new Date()}
                textColor={colors.textPrimary}
                style={{ height: 200 }}
              />
              <View style={styles.iosPickerActions}>
                <TouchableOpacity onPress={() => setDatePickerTarget(null)} style={styles.iosPickerBtn}>
                  <Text style={styles.iosPickerBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIOSDate} style={[styles.iosPickerBtn, styles.iosPickerBtnPrimary]}>
                  <Text style={[styles.iosPickerBtnText, styles.iosPickerBtnPrimaryText]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Device picker */}
      <Modal visible={devicePickerOpen} transparent animationType="fade" onRequestClose={() => setDevicePickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDevicePickerOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Filter by Device</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  filterScroll: { borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 14, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterBtn: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexShrink: 0,
  },
  filterText: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, includeFontPadding: false },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateActive: { color: colors.blueLight },
  iosPickerCard: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  iosPickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  iosPickerBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  iosPickerBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  iosPickerBtnText: { color: colors.textSecondary, fontSize: 14 },
  iosPickerBtnPrimaryText: { color: '#fff', fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 7 },
  clearText: { color: colors.blueLight, fontSize: 12 },
  totalText: { color: colors.textSecondary, fontSize: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  rowInfo: { flex: 1 },
  rowDevice: { color: colors.blueLight, fontSize: 12, fontFamily: 'monospace' },
  rowTask: { color: colors.textPrimary, fontSize: 12, fontFamily: 'monospace', marginTop: 1 },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 12, alignSelf: 'center' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  pageBtn: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { color: colors.textPrimary, fontSize: 18 },
  pageInfo: { color: colors.textSecondary, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  pickerCard: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  pickerTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  pickerItemActive: { backgroundColor: colors.primary + '22' },
  pickerItemText: { color: colors.textSecondary, fontSize: 14 },
  pickerItemTextActive: { color: colors.blueLight, fontWeight: '600' },
});
