import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react-native';
import { createDevice, deleteDevice, getDevices, updateDevice } from '../../src/services/api';
import { RowSkeleton } from '../../src/components/Skeleton';
import { colors } from '../../src/theme';
import type { Device } from '../../src/types';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (p = page) => {
    try {
      const res = await getDevices(p, 15);
      setDevices(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {}
  }, [page]);

  useEffect(() => {
    load(page).finally(() => setLoading(false));
  }, [page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(page);
    setRefreshing(false);
  }, [load, page]);

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const updated = await updateDevice(id, editName);
      setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setEditId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Device', `Delete device "${id}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDevice(id);
            setDevices((prev) => prev.filter((d) => d.id !== id));
            setTotal((t) => t - 1);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  async function handleAdd() {
    if (!newId || !newName) return;
    setAdding(true);
    try {
      const d = await createDevice(newId, newName);
      setDevices((prev) => [d, ...prev]);
      setTotal((t) => t + 1);
      setAddOpen(false);
      setNewId('');
      setNewName('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.total}>{total} devices</Text>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Device</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(d) => d.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item: d }) => (
            editId === d.id ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                <Pressable onPress={() => handleSave(d.id)} disabled={saving} style={styles.iconBtn}>
                  {saving ? <ActivityIndicator size="small" color={colors.success} /> : <Check size={18} color={colors.success} />}
                </Pressable>
                <Pressable onPress={() => setEditId(null)} style={styles.iconBtn}>
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowId}>{d.id}</Text>
                  <Text style={styles.rowName}>{d.name}</Text>
                </View>
                <Pressable style={styles.iconBtn} onPress={() => { setEditId(d.id); setEditName(d.name); }}>
                  <Pencil size={15} color={colors.blueLight} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => handleDelete(d.id)}>
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

      {/* Add modal */}
      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAddOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Device</Text>
              <Pressable onPress={() => setAddOpen(false)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.label}>Device ID</Text>
            <TextInput style={styles.input} value={newId} onChangeText={setNewId} placeholder="e.g. notebook-linux-1" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Display name" placeholderTextColor={colors.textMuted} />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.submitBtn, (!newId || !newName) && styles.btnDisabled]} onPress={handleAdd} disabled={!newId || !newName || adding}>
                {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Add</Text>}
              </Pressable>
            </View>
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
  },
  total: { color: colors.textSecondary, fontSize: 13 },
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  rowInfo: { flex: 1 },
  rowId: { color: colors.blueLight, fontSize: 12, fontFamily: 'monospace' },
  rowName: { color: colors.textPrimary, fontSize: 13, marginTop: 2 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  iconBtn: { padding: 6 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  pageBtn: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { color: colors.textPrimary, fontSize: 18 },
  pageInfo: { color: colors.textSecondary, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modal: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  label: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.textPrimary, fontWeight: '500' },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
