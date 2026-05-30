import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Pencil, Plus, Trash2, X, Webhook } from 'lucide-react-native';
import {
  createTask,
  deleteTask,
  getDevices,
  getTasks,
  updateTask,
} from '../../src/services/api';
import { getMe } from '../../src/services/api';
import { RowSkeleton } from '../../src/components/Skeleton';
import { colors } from '../../src/theme';
import type { Device, Task } from '../../src/types';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState('');
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editCron, setEditCron] = useState('');
  const [editWarn, setEditWarn] = useState('');
  const [editCrit, setEditCrit] = useState('');
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newCron, setNewCron] = useState('');
  const [newWarn, setNewWarn] = useState('');
  const [newCrit, setNewCrit] = useState('');
  const [adding, setAdding] = useState(false);

  const [payloadTask, setPayloadTask] = useState<Task | null>(null);
  const [apiKey, setApiKey] = useState('');

  const load = useCallback(async (p = page) => {
    try {
      const [res, devs] = await Promise.all([
        getTasks({ device_id: deviceFilter || undefined, page: p, limit: 15 }),
        getDevices(1, 100),
      ]);
      setTasks(res.data);
      setTotal(res.total);
      setPages(res.pages);
      setDevices(devs.data);
    } catch {}
  }, [page, deviceFilter]);

  useEffect(() => {
    load(page).finally(() => setLoading(false));
  }, [page, deviceFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(page);
    setRefreshing(false);
  }, [load, page]);

  async function handleSave(t: Task) {
    setSaving(true);
    try {
      const updated = await updateTask(t.id, {
        cron: editCron || null,
        warning_hours: editWarn ? Number(editWarn) : null,
        critical_hours: editCrit ? Number(editCrit) : null,
      });
      setTasks((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      setEditId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Task', 'Delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
            setTotal((n) => n - 1);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  async function handleAdd() {
    if (!newDeviceId || !newTask) return;
    setAdding(true);
    try {
      const t = await createTask({
        device_id: newDeviceId,
        task: newTask,
        cron: newCron || undefined,
        warning_hours: newWarn ? Number(newWarn) : undefined,
        critical_hours: newCrit ? Number(newCrit) : undefined,
      });
      setTasks((prev) => [t, ...prev]);
      setTotal((n) => n + 1);
      setAddOpen(false);
      setNewDeviceId(''); setNewTask(''); setNewCron(''); setNewWarn(''); setNewCrit('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  }

  async function showPayload(t: Task) {
    try {
      if (!apiKey) {
        const me = await getMe();
        setApiKey(me.api_key);
      }
      setPayloadTask(t);
    } catch {}
  }

  const payload = payloadTask ? JSON.stringify({
    api_key: apiKey || '<your-api-key>',
    device_id: payloadTask.device_id,
    source: 'my-script',
    task: payloadTask.task,
    status: 'success',
  }, null, 2) : '';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.filterBtn} onPress={() => setDevicePickerOpen(true)}>
          <Text style={styles.filterText} numberOfLines={1}>{deviceFilter || 'All devices'}</Text>
        </Pressable>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Task</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item: t }) => (
            editId === t.id ? (
              <View style={styles.editCard}>
                <Text style={styles.editCardTitle}>{t.device_id} / {t.task}</Text>
                <View style={styles.editRow}>
                  <TextInput style={styles.editInput} value={editCron} onChangeText={setEditCron} placeholder="Cron" placeholderTextColor={colors.textMuted} />
                  <TextInput style={[styles.editInput, styles.smallInput]} value={editWarn} onChangeText={setEditWarn} placeholder="Warn h" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                  <TextInput style={[styles.editInput, styles.smallInput]} value={editCrit} onChangeText={setEditCrit} placeholder="Crit h" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
                </View>
                <View style={styles.editActions}>
                  <Pressable style={styles.editSaveBtn} onPress={() => handleSave(t)} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.editSaveBtnText}>Save</Text>}
                  </Pressable>
                  <Pressable style={styles.editCancelBtn} onPress={() => setEditId(null)}>
                    <Text style={styles.editCancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowDevice}>{t.device_id}</Text>
                  <Text style={styles.rowTask}>{t.task}</Text>
                  {t.cron ? <Text style={styles.rowMeta}>{t.cron}</Text> : null}
                  {(t.warning_hours || t.critical_hours) ? (
                    <Text style={styles.rowMeta}>
                      {t.warning_hours ? `⚠ ${t.warning_hours}h` : ''}{t.warning_hours && t.critical_hours ? '  ' : ''}{t.critical_hours ? `✖ ${t.critical_hours}h` : ''}
                    </Text>
                  ) : null}
                </View>
                <Pressable style={styles.iconBtn} onPress={() => showPayload(t)}>
                  <Webhook size={15} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => { setEditId(t.id); setEditCron(t.cron ?? ''); setEditWarn(t.warning_hours ? String(t.warning_hours) : ''); setEditCrit(t.critical_hours ? String(t.critical_hours) : ''); }}>
                  <Pencil size={15} color={colors.blueLight} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => handleDelete(t.id)}>
                  <Trash2 size={15} color={colors.critical} />
                </Pressable>
              </View>
            )
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

      {/* Device picker */}
      <Modal visible={devicePickerOpen} transparent animationType="fade" onRequestClose={() => setDevicePickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDevicePickerOpen(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Filter by Device</Text>
            {[{ id: '', name: 'All devices' }, ...devices].map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.pickerItem, deviceFilter === d.id && styles.pickerItemActive]}
                onPress={() => { setDeviceFilter(d.id); setDevicePickerOpen(false); setPage(1); }}
              >
                <Text style={[styles.pickerItemText, deviceFilter === d.id && styles.pickerItemTextActive]}>
                  {d.name || d.id || 'All devices'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Add modal */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAddOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Task</Text>
              <Pressable onPress={() => setAddOpen(false)}><X size={20} color={colors.textSecondary} /></Pressable>
            </View>
            <Text style={styles.label}>Device ID</Text>
            <TextInput style={styles.input} value={newDeviceId} onChangeText={setNewDeviceId} placeholder="device-id" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <Text style={styles.label}>Task</Text>
            <TextInput style={styles.input} value={newTask} onChangeText={setNewTask} placeholder="task-name" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <Text style={styles.label}>Cron (optional)</Text>
            <TextInput style={styles.input} value={newCron} onChangeText={setNewCron} placeholder="0 2 * * *" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Warn hours</Text>
                <TextInput style={styles.input} value={newWarn} onChangeText={setNewWarn} placeholder="24" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Crit hours</Text>
                <TextInput style={styles.input} value={newCrit} onChangeText={setNewCrit} placeholder="72" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, (!newDeviceId || !newTask) && styles.btnDisabled]} onPress={handleAdd} disabled={!newDeviceId || !newTask || adding}>
                {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Add</Text>}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Payload modal */}
      <Modal visible={!!payloadTask} transparent animationType="fade" onRequestClose={() => setPayloadTask(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPayloadTask(null)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Webhook Payload</Text>
              <Pressable onPress={() => setPayloadTask(null)}><X size={20} color={colors.textSecondary} /></Pressable>
            </View>
            <Text style={styles.payloadHint}>POST to: /webhooks/sync</Text>
            <ScrollView horizontal>
              <Text style={styles.payloadCode}>{payload}</Text>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterText: { color: colors.textSecondary, fontSize: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  rowInfo: { flex: 1 },
  rowDevice: { color: colors.blueLight, fontSize: 11, fontFamily: 'monospace' },
  rowTask: { color: colors.textPrimary, fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 6, marginTop: 2 },
  editCard: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  editCardTitle: { color: colors.textSecondary, fontSize: 11, marginBottom: 8 },
  editRow: { flexDirection: 'row', gap: 6 },
  editInput: {
    flex: 2,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  smallInput: { flex: 1 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editSaveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  editSaveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editCancelBtn: { flex: 1, backgroundColor: colors.bgTertiary, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  editCancelBtnText: { color: colors.textPrimary, fontSize: 13 },
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
  modal: { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  label: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.textPrimary, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: colors.bgTertiary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  cancelBtnText: { color: colors.textPrimary, fontWeight: '500' },
  submitBtn: { flex: 1, backgroundColor: colors.secondary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  payloadHint: { color: colors.textMuted, fontSize: 11, marginBottom: 8 },
  payloadCode: { color: colors.greenLight, fontSize: 12, fontFamily: 'monospace', lineHeight: 20, padding: 12, backgroundColor: '#0a0f1a', borderRadius: 8 },
});
