import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/ui/theme';

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  /** Horizontal reference line (e.g. the average). */
  reference?: number;
  unit?: string;
  height?: number;
  accessibilityLabel: string;
}

const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const GAP = 6;

export function BarChart({
  data,
  reference,
  unit = '',
  height = 160,
  accessibilityLabel,
}: BarChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values, reference ?? 0);
  const min = 0;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH - ((v - min) / (max - min)) * plotH;
  const barW = data.length ? Math.max(4, (width - GAP * (data.length - 1)) / data.length) : 0;

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {reference !== undefined ? (
            <Line
              x1={0}
              x2={width}
              y1={y(reference)}
              y2={y(reference)}
              stroke={colors.textMuted}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ) : null}
          {data.map((d, i) => {
            const x = i * (barW + GAP);
            const top = y(d.value);
            return (
              <G key={`${d.label}-${i}`}>
                <Rect
                  x={x}
                  y={top}
                  width={barW}
                  height={PAD_TOP + plotH - top}
                  rx={4}
                  fill={colors.accent}
                />
                <SvgText
                  x={x + barW / 2}
                  y={top - 5}
                  fontSize={11}
                  fill={colors.text}
                  textAnchor="middle"
                >
                  {`${d.value}${unit}`}
                </SvgText>
                <SvgText
                  x={x + barW / 2}
                  y={height - 6}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
