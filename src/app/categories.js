import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, IconCircle, SegmentedControl } from '../components/ui';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants/defaults';
import { radius, spacing } from '../constants/theme';
import { useAppTheme } from '../lib/useAppTheme';
import { useStore } from '../store/StoreProvider';

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const { categories, transactions, saveCategory, deleteCategory } = useStore();
  const [type, setType] = useState('expense');
  const [draft, setDraft] = useState(null);

  const list = categories.filter((c) => c.type === type);
  const usage = (id) => transactions.filter((t) => t.categoryId === id).length;

  const confirmDelete = (c) => {
    const n = usage(c.id);
    Alert.alert(
      `Delete "${c.name}"?`,
      n ? `${n} transaction${n === 1 ? '' : 's'} will be moved to "Other".` : 'This category will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(c.id);
            setDraft(null);
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={10}
              accessibilityLabel="Add category"
              onPress={() => setDraft({ name: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[10], type })}
            >
              <Ionicons name="add" size={26} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Expense', color: colors.expense },
            { value: 'income', label: 'Income', color: colors.income },
          ]}
        />
        <Card style={{ marginTop: spacing.lg, paddingVertical: spacing.sm }}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setDraft({ ...c })}
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
            >
              <IconCircle icon={c.icon} color={c.color} size={38} />
              <View style={{ flex: 1 }}>
                <AppText variant="label">{c.name}</AppText>
                <AppText variant="caption" muted>
                  {usage(c.id)} transactions{c.builtIn ? ' · Default' : ''}
                </AppText>
              </View>
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>
        <Button
          title={`New ${type} category`}
          icon="add"
          kind="secondary"
          style={{ marginTop: spacing.lg }}
          onPress={() => setDraft({ name: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[10], type })}
        />
      </ScrollView>

      <CategoryEditor
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSave={(d) => {
          const name = d.name.trim();
          if (!name) return;
          saveCategory({ ...d, name });
          setDraft(null);
        }}
        onDelete={(d) => {
          const c = categories.find((x) => x.id === d.id);
          if (c) confirmDelete(c);
        }}
      />
    </View>
  );
}

function CategoryEditor({ draft, onChange, onClose, onSave, onDelete }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  if (!draft) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
          <Pressable
            onPress={() => {}}
            style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.sheetHeader}>
              <IconCircle icon={draft.icon} color={draft.color} size={48} />
              <TextInput
                value={draft.name}
                onChangeText={(name) => onChange({ ...draft, name })}
                placeholder="Category name"
                placeholderTextColor={colors.textMuted}
                autoFocus={!draft.id}
                maxLength={24}
                style={[styles.nameInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
              />
            </View>

            <AppText variant="label" muted style={styles.label}>
              Icon
            </AppText>
            <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={styles.iconGrid}>
              {CATEGORY_ICONS.map((icon) => {
                const selected = icon === draft.icon;
                return (
                  <Pressable
                    key={icon}
                    onPress={() => onChange({ ...draft, icon })}
                    style={[styles.iconCell, { backgroundColor: selected ? draft.color + '33' : colors.surfaceAlt }]}
                  >
                    <Ionicons name={icon} size={20} color={selected ? draft.color : colors.textMuted} />
                  </Pressable>
                );
              })}
            </ScrollView>

            <AppText variant="label" muted style={styles.label}>
              Color
            </AppText>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => onChange({ ...draft, color })}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color, borderColor: color === draft.color ? colors.text : 'transparent' },
                  ]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              {draft.id && !draft.builtIn ? (
                <Button title="Delete" kind="danger" onPress={() => onDelete(draft)} style={{ flex: 1 }} />
              ) : null}
              <Button title="Cancel" kind="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Save" onPress={() => onSave(draft)} disabled={!draft.name.trim()} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
});
