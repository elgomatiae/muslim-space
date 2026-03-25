import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '@/styles/commonStyles';

export type SectionScoresInput = {
  ibadah: number;
  ilm: number;
  amanah: number;
};

const IBADAH = '#10B981';
const ILM = '#3B82F6';
const AMANAH = '#F59E0B';

const RING_DIMS = {
  sm: { svg: 76, cx: 38, cy: 38, ibR: 32, ibS: 5, ilR: 24, ilS: 4, amR: 16, amS: 3.5, center: 30, font: 11 },
  md: { svg: 96, cx: 48, cy: 48, ibR: 40, ibS: 6.5, ilR: 30, ilS: 5.5, amR: 20, amS: 4.5, center: 38, font: 13 },
  lg: { svg: 112, cx: 56, cy: 56, ibR: 46, ibS: 7, ilR: 34, ilS: 6, amR: 22, amS: 5, center: 44, font: 14 },
};

/** Matches overall Iman % from section scores (same weights as tracker). */
export function weightedImanFromSections(s: SectionScoresInput): number {
  return Math.round(s.ibadah * 0.6 + s.ilm * 0.25 + s.amanah * 0.15);
}

function RingCircle({
  cx,
  cy,
  r,
  strokeW,
  progress,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  strokeW: number;
  progress: number;
  color: string;
}) {
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={colors.border}
        strokeWidth={strokeW}
        fill="none"
        opacity={0.22}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={strokeW}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  );
}

export function MiniImanRings({
  sectionScores,
  size = 'sm',
  /** When ring segments are unavailable/stale, show stored overall Iman % in the center. */
  overallOverride,
}: {
  sectionScores: SectionScoresInput;
  size?: 'sm' | 'md' | 'lg';
  overallOverride?: number;
}) {
  const d = RING_DIMS[size];
  const ib = (sectionScores.ibadah || 0) / 100;
  const il = (sectionScores.ilm || 0) / 100;
  const am = (sectionScores.amanah || 0) / 100;
  const overall =
    overallOverride !== undefined ? Math.round(overallOverride) : weightedImanFromSections(sectionScores);

  return (
    <View style={[styles.ringsWrap, { width: d.svg, height: d.svg }]}>
      <Svg width={d.svg} height={d.svg} style={StyleSheet.absoluteFillObject}>
        <RingCircle cx={d.cx} cy={d.cy} r={d.ibR} strokeW={d.ibS} progress={ib} color={IBADAH} />
        <RingCircle cx={d.cx} cy={d.cy} r={d.ilR} strokeW={d.ilS} progress={il} color={ILM} />
        <RingCircle cx={d.cx} cy={d.cy} r={d.amR} strokeW={d.amS} progress={am} color={AMANAH} />
      </Svg>
      <View style={[styles.ringsCenter, { width: d.center, height: d.center }]}>
        <Text style={[styles.ringsCenterText, { fontSize: d.font }]}>{overall}%</Text>
      </View>
    </View>
  );
}

const PILLAR_META = [
  { key: 'ibadah' as const, label: 'ʿIbādah', short: 'I', color: IBADAH },
  { key: 'ilm' as const, label: 'ʿIlm', short: 'L', color: ILM },
  { key: 'amanah' as const, label: 'Amanah', short: 'A', color: AMANAH },
];

/** Compact horizontal chips for tight layouts (e.g. podium). */
export function PillarBreakdownChips({
  sectionScores,
  center,
}: {
  sectionScores: SectionScoresInput;
  /** Center chips (e.g. podium). Default left-aligns for list rows. */
  center?: boolean;
}) {
  return (
    <View style={[styles.chipsRow, center && styles.chipsRowCenter]}>
      {PILLAR_META.map((p) => {
        const v = Math.round(sectionScores[p.key] ?? 0);
        return (
          <View
            key={p.key}
            style={[styles.chip, styles.chipDark, { borderLeftColor: p.color, borderLeftWidth: 3 }]}
          >
            <Text style={styles.chipShort}>{p.short}</Text>
            <Text style={styles.chipVal}>{v}%</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Full labels + fill bars for list rows. */
export function PillarBreakdownBars({
  sectionScores,
}: {
  sectionScores: SectionScoresInput;
}) {
  return (
    <View style={styles.barsCol}>
      {PILLAR_META.map((p) => {
        const v = Math.min(100, Math.max(0, Math.round(sectionScores[p.key] ?? 0)));
        return (
          <View key={p.key} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {p.label}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${v}%`, backgroundColor: p.color }]} />
            </View>
            <Text style={styles.barPct}>{v}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ringsWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringsCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringsCenterText: {
    ...typography.small,
    fontWeight: '900',
    color: colors.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chipsRowCenter: {
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  chipDark: {
    backgroundColor: colors.highlight,
  },
  chipShort: {
    ...typography.small,
    fontWeight: '800',
    color: colors.textSecondary,
    fontSize: 10,
  },
  chipVal: {
    ...typography.small,
    fontWeight: '800',
    color: colors.text,
    fontSize: 12,
  },
  barsCol: {
    gap: 6,
    width: '100%',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
    width: 56,
    fontSize: 11,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barPct: {
    ...typography.small,
    fontWeight: '800',
    color: colors.text,
    width: 34,
    textAlign: 'right',
    fontSize: 11,
  },
});
