import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Card, ListRow, SectionHeader, SegmentedControl } from '../../components/ui';
import { CURRENCIES } from '../../constants/defaults';
import { radius, spacing } from '../../constants/theme';
import { transactionsToCsv, shareCsv } from '../../lib/export';
import { currencySymbol } from '../../lib/format';
import { generateSampleData } from '../../lib/sampleData';
import { useAppTheme } from '../../lib/useAppTheme';
import { useStore } from '../../store/StoreProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { settings, updateSettings, transactions, categoryById, categories, addTransactions, resetData } = useStore();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const currencyName = CURRENCIES.find((c) => c.code === settings.currency)?.name ?? settings.currency;

  const exportCsv = async () => {
    if (!transactions.length) {
      Alert.alert('Nothing to export', 'Add some transactions first.');
      return;
    }
    try {
      await shareCsv(transactionsToCsv(transactions, categoryById, settings.currency));
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  };

  const loadSample = () =>
    Alert.alert('Load sample data?', 'Adds about 3 months of demo transactions so you can explore the app.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load', onPress: () => addTransactions(generateSampleData()) },
    ]);

  const reset = () =>
    Alert.alert('Erase all data?', 'This permanently deletes all transactions, budgets and custom categories.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: resetData },
    ]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <SectionHeader title="Preferences" />
      <Card style={{ paddingVertical: spacing.sm }}>
        <ListRow
          icon="cash-outline"
          title="Currency"
          subtitle={`${currencyName} (${currencySymbol(settings.currency)})`}
          onPress={() => setCurrencyOpen(true)}
        />
        <View style={{ paddingVertical: 10, gap: 10 }}>
          <View style={styles.inline}>
            <Ionicons name="contrast-outline" size={18} color={colors.primary} />
            <AppText variant="label">Appearance</AppText>
          </View>
          <SegmentedControl
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </View>
      </Card>

      <SectionHeader title="Data" />
      <Card style={{ paddingVertical: spacing.sm }}>
        <ListRow
          icon="pricetags-outline"
          title="Manage categories"
          subtitle={`${categories.length} categories`}
          onPress={() => router.push('/categories')}
        />
        <ListRow
          icon="download-outline"
          title="Export to CSV"
          subtitle={`${transactions.length} transactions`}
          onPress={exportCsv}
        />
        <ListRow
          icon="flask-outline"
          title="Load sample data"
          subtitle="Try the app with demo data"
          onPress={loadSample}
        />
        <ListRow icon="trash-outline" title="Erase all data" destructive onPress={reset} />
      </Card>

      <AppText variant="caption" muted style={{ textAlign: 'center', marginTop: spacing.xl }}>
        Expense Tracker v{Constants.expoConfig?.version ?? '1.0.0'} · Data is stored only on this device
      </AppText>

      <Modal visible={currencyOpen} animationType="slide" transparent onRequestClose={() => setCurrencyOpen(false)}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setCurrencyOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.lg }]}
          >
            <AppText variant="heading" style={{ marginBottom: spacing.md }}>
              Choose currency
            </AppText>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => {
                const selected = item.code === settings.currency;
                return (
                  <Pressable
                    onPress={() => {
                      updateSettings({ currency: item.code });
                      setCurrencyOpen(false);
                    }}
                    style={[styles.currencyRow, selected && { backgroundColor: colors.primarySoft }]}
                  >
                    <AppText variant="label" style={{ width: 48 }}>
                      {currencySymbol(item.code)}
                    </AppText>
                    <AppText style={{ flex: 1 }}>
                      {item.name} ({item.code})
                    </AppText>
                    {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '70%', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
});
