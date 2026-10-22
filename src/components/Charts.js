import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Rect, Line } from 'react-native-svg';

import { formatMoney } from '../lib/format';
import { useAppTheme } from '../lib/useAppTheme';
import { AppText } from './ui';

/** Ring chart; children are rendered centered inside the ring. */
export function DonutChart({ slices, size = 200, thickness = 26, children }) {
  const { colors } = useAppTheme();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.value, 0);
  const gap = slices.length > 1 ? 2 : 0;

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Start the first slice at 12 o'clock. */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={thickness} fill="none" />
          {total > 0 &&
            slices.map((s, i) => {
              const len = (s.value / total) * c;
              const dash = Math.max(0, len - gap);
              const el = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
        </G>
      </Svg>
      {children}
    </View>
  );
}

/** Simple vertical bar chart that fills its container width. */
export function BarChart({ data, height = 140, color, labels, highlightIndex }) {
  const { colors, currency } = useAppTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(...data, 0);
  const n = data.length;
  const slot = n ? width / n : 0;
  const barW = Math.max(2, slot * 0.62);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <AppText variant="caption" muted style={{ marginBottom: 6 }}>
        Max {formatMoney(max, currency, { compact: true })}
      </AppText>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={colors.border} strokeWidth={1} />
          {data.map((v, i) => {
            const h = max > 0 ? Math.max(v > 0 ? 3 : 0, (v / max) * (height - 4)) : 0;
            return (
              <Rect
                key={i}
                x={i * slot + (slot - barW) / 2}
                y={height - h}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                fill={color}
                opacity={highlightIndex === undefined || highlightIndex === i ? 1 : 0.45}
              />
            );
          })}
        </Svg>
      )}
      {labels && width > 0 && (
        <View style={{ height: 16, marginTop: 4 }}>
          {Object.entries(labels).map(([i, text]) => (
            <AppText
              key={i}
              variant="caption"
              muted
              style={{ position: 'absolute', left: Number(i) * slot, width: slot, textAlign: 'center', fontSize: 10 }}
              numberOfLines={1}
            >
              {text}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}

/** Paired income/expense bars per month. */
export function GroupedBarChart({ groups, height = 150 }) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(...groups.flatMap((g) => [g.income, g.expense]), 0);
  const slot = groups.length ? width / groups.length : 0;
  const barW = Math.min(18, slot * 0.3);
  const barH = (v) => (max > 0 ? Math.max(v > 0 ? 3 : 0, (v / max) * (height - 4)) : 0);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={height - 0.5} y2={height - 0.5} stroke={colors.border} strokeWidth={1} />
          {groups.map((g, i) => {
            const cx = i * slot + slot / 2;
            return (
              <G key={g.label}>
                <Rect
                  x={cx - barW - 2}
                  y={height - barH(g.income)}
                  width={barW}
                  height={barH(g.income)}
                  rx={4}
                  fill={colors.income}
                />
                <Rect
                  x={cx + 2}
                  y={height - barH(g.expense)}
                  width={barW}
                  height={barH(g.expense)}
                  rx={4}
                  fill={colors.expense}
                />
              </G>
            );
          })}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {groups.map((g) => (
          <AppText key={g.label} variant="caption" muted style={{ flex: 1, textAlign: 'center' }}>
            {g.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}
