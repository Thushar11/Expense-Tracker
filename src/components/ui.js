import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../constants/theme';
import { addMonths, currentMonthKey, formatMonth } from '../lib/date';
import { useAppTheme } from '../lib/useAppTheme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

const variantStyles = {
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12 },
};

export function AppText({ variant = 'body', muted, color, style, ...rest }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[variantStyles[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
      {...rest}
    />
  );
}

export function Card({ children, style }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading">{title}</AppText>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <AppText variant="label" color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function IconCircle({ icon, color, size = 40 }) {
  return (
    <View
      style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' }]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function Button({ title, onPress, icon, kind = 'primary', disabled, style }) {
  const { colors } = useAppTheme();
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.expenseSoft : colors.surfaceAlt;
  const fg = kind === 'primary' ? colors.onPrimary : kind === 'danger' ? colors.expense : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <AppText variant="label" color={fg} style={{ fontSize: 16 }}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon, color }) {
  const { colors } = useAppTheme();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.chip,
        { borderColor: selected ? accent : colors.border, backgroundColor: selected ? accent + '1F' : colors.surface },
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={selected ? accent : colors.textMuted} /> : null}
      <AppText variant="label" style={{ fontSize: 13 }} color={selected ? accent : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChipRow({ children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segment, active && { backgroundColor: colors.surface, ...shadow }]}
          >
            <AppText variant="label" color={active ? (o.color ?? colors.text) : colors.textMuted}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function EmptyState({ icon, title, message }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <AppText variant="heading">{title}</AppText>
      {message ? (
        <AppText muted style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

export function Fab({ onPress }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel="Add transaction"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <Ionicons name="add" size={30} color={colors.onPrimary} />
    </Pressable>
  );
}

export function MonthSwitcher({ month, onChange }) {
  const { colors } = useAppTheme();
  const atCurrent = month >= currentMonthKey();
  return (
    <View style={[styles.monthSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable hitSlop={12} onPress={() => onChange(addMonths(month, -1))} accessibilityLabel="Previous month">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => onChange(currentMonthKey())}>
        <AppText variant="label" style={{ fontSize: 16 }}>
          {formatMonth(month)}
        </AppText>
      </Pressable>
      <Pressable
        hitSlop={12}
        disabled={atCurrent}
        onPress={() => onChange(addMonths(month, 1))}
        accessibilityLabel="Next month"
      >
        <Ionicons name="chevron-forward" size={22} color={atCurrent ? colors.border : colors.text} />
      </Pressable>
    </View>
  );
}

export function ListRow({ icon, iconColor, title, subtitle, right, onPress, destructive }) {
  const { colors } = useAppTheme();
  const tint = destructive ? colors.expense : (iconColor ?? colors.primary);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.6 : 1 }]}
    >
      <IconCircle icon={icon} color={tint} size={36} />
      <View style={{ flex: 1 }}>
        <AppText variant="label" color={destructive ? colors.expense : colors.text}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" muted>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipRow: { gap: spacing.sm, paddingVertical: 2 },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: 48, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
});
