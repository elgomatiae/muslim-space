import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import { getScreenWidth } from "@/utils/screenDimensions";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_W = getScreenWidth();
const BOARD = 400;
const CX = 200;
const CY = 200;

const IBADAH = { key: "ibadah" as const, label: "ʿIbādah", c: "#10B981", cd: "#047857" };
const ILM = { key: "ilm" as const, label: "ʿIlm", c: "#3B82F6", cd: "#1D4ED8" };
const AMANAH = { key: "amanah" as const, label: "Amanah", c: "#F59E0B", cd: "#B45309" };

interface ImanRingsDisplayProps {
  onRefresh?: () => void;
  /**
   * Renders the same rings UI without the outer tracker card chrome — for Home hero inset.
   * Optional breakdown toggle can be hidden to keep the hero minimal.
   */
  embedded?: boolean;
  /** Max width (px) used to scale the ring board when embedded (default ~min(screen-48, 320)). */
  embeddedMaxBoardWidth?: number;
  /** When embedded: hide chevron + expandable pillar breakdown (tap “open tracker” instead). */
  hideBreakdownToggle?: boolean;
}

export default function ImanRingsDisplay({
  onRefresh,
  embedded = false,
  embeddedMaxBoardWidth,
  hideBreakdownToggle = false,
}: ImanRingsDisplayProps) {
  const { sectionScores, imanScore, isLoading, error } = useImanTracker();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const ringScale = useMemo(() => {
    if (embedded) {
      const cap = embeddedMaxBoardWidth ?? Math.min(SCREEN_W - 48, 320);
      return Math.min(1, cap / BOARD);
    }
    return Math.min(1, (SCREEN_W - 56) / BOARD);
  }, [embedded, embeddedMaxBoardWidth]);

  const ibadahRadius = 168;
  const ibadahStroke = 22;
  const ilmRadius = 124;
  const ilmStroke = 20;
  const amanahRadius = 82;
  const amanahStroke = 18;

  const ibC = 2 * Math.PI * ibadahRadius;
  const ilC = 2 * Math.PI * ilmRadius;
  const amC = 2 * Math.PI * amanahRadius;

  const ibP = sectionScores.ibadah / 100;
  const ilP = sectionScores.ilm / 100;
  const amP = sectionScores.amanah / 100;
  const ibProgress = Math.max(0, Math.min(1, ibP || 0));
  const ilProgress = Math.max(0, Math.min(1, ilP || 0));
  const amProgress = Math.max(0, Math.min(1, amP || 0));
  const useGradientStroke = Platform.OS !== "web";

  const ibadahColor = IBADAH.c;
  const ibadahColorDeep = IBADAH.cd;
  const ilmColor = ILM.c;
  const ilmColorDeep = ILM.cd;
  const amanahColor = AMANAH.c;
  const amanahColorDeep = AMANAH.cd;

  const getDecayWarning = () => {
    if (imanScore < 30) return { text: "Score low — add goals.", color: colors.error };
    if (imanScore < 50) return { text: "Stay active this week.", color: colors.warning };
    return null;
  };

  const decayWarning = getDecayWarning();

  const pillars = [
    { meta: IBADAH, score: sectionScores.ibadah },
    { meta: ILM, score: sectionScores.ilm },
    { meta: AMANAH, score: sectionScores.amanah },
  ];

  const toggleBreakdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBreakdown((v) => !v);
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={[styles.cardInner, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <View style={[styles.cardInner, styles.centered]}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
      <View style={[styles.ringsWrapper, { width: BOARD * ringScale, height: BOARD * ringScale }]}>
        <View style={{ width: BOARD, height: BOARD, transform: [{ scale: ringScale }] }}>
          <Svg width={BOARD} height={BOARD}>
            <Defs>
              <SvgLinearGradient id="gradIbadah" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#6EE7B7" />
                <Stop offset="100%" stopColor={ibadahColorDeep} />
              </SvgLinearGradient>
              <SvgLinearGradient id="gradIlm" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#93C5FD" />
                <Stop offset="100%" stopColor={ilmColorDeep} />
              </SvgLinearGradient>
              <SvgLinearGradient id="gradAmanah" x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FDE68A" />
                <Stop offset="100%" stopColor={amanahColorDeep} />
              </SvgLinearGradient>
            </Defs>

            <Circle cx={CX} cy={CY} r={ibadahRadius} stroke={colors.border} strokeWidth={ibadahStroke} fill="none" />
            <Circle
              cx={CX}
              cy={CY}
              r={ibadahRadius}
              stroke={useGradientStroke ? "url(#gradIbadah)" : ibadahColor}
              strokeWidth={ibadahStroke}
              fill="none"
              strokeDasharray={`${ibC} ${ibC}`}
              strokeDashoffset={ibC * (1 - ibProgress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
            />

            <Circle cx={CX} cy={CY} r={ilmRadius} stroke={colors.border} strokeWidth={ilmStroke} fill="none" />
            <Circle
              cx={CX}
              cy={CY}
              r={ilmRadius}
              stroke={useGradientStroke ? "url(#gradIlm)" : ilmColor}
              strokeWidth={ilmStroke}
              fill="none"
              strokeDasharray={`${ilC} ${ilC}`}
              strokeDashoffset={ilC * (1 - ilProgress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
            />

            <Circle cx={CX} cy={CY} r={amanahRadius} stroke={colors.border} strokeWidth={amanahStroke} fill="none" />
            <Circle
              cx={CX}
              cy={CY}
              r={amanahRadius}
              stroke={useGradientStroke ? "url(#gradAmanah)" : amanahColor}
              strokeWidth={amanahStroke}
              fill="none"
              strokeDasharray={`${amC} ${amC}`}
              strokeDashoffset={amC * (1 - amProgress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          </Svg>
        </View>

        {hideBreakdownToggle ? (
          <View style={styles.centerHit} pointerEvents="box-none">
            <View style={styles.centerDisc}>
              <LinearGradient colors={["#FFFFFF", "#F8FAFF"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
              <View style={styles.centerInner}>
                <View style={styles.centerScoreRow}>
                  <Text style={styles.centerScoreNum}>{Math.round(imanScore)}</Text>
                  <Text style={styles.centerScorePct}>%</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.centerHit} onPress={toggleBreakdown} activeOpacity={0.85}>
            <View style={styles.centerDisc}>
              <LinearGradient colors={["#FFFFFF", "#F8FAFF"]} style={StyleSheet.absoluteFillObject} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
              <View style={styles.centerInner}>
                <View style={styles.centerScoreRow}>
                  <Text style={styles.centerScoreNum}>{Math.round(imanScore)}</Text>
                  <Text style={styles.centerScorePct}>%</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: ibadahColor }]} />
          <Text style={styles.legendText}>ʿIbādah</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: ilmColor }]} />
          <Text style={styles.legendText}>ʿIlm</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: amanahColor }]} />
          <Text style={styles.legendText}>Amanah</Text>
        </View>
      </View>

      <View style={styles.strip}>
        {pillars.map(({ meta, score }) => (
          <View key={meta.key} style={styles.stripSeg}>
            <View style={[styles.stripFill, { width: `${Math.min(100, score)}%`, backgroundColor: meta.c }]} />
          </View>
        ))}
      </View>

      {decayWarning && (
        <View style={[styles.warningBox, { borderColor: decayWarning.color + "35" }]}>
          <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={18} color={decayWarning.color} />
          <Text style={[styles.warningText, { color: decayWarning.color }]}>{decayWarning.text}</Text>
        </View>
      )}

      {!hideBreakdownToggle && (
        <TouchableOpacity style={styles.detailsBtn} onPress={toggleBreakdown} hitSlop={12} accessibilityLabel={showBreakdown ? "Hide details" : "Show details"}>
          <IconSymbol
            ios_icon_name={showBreakdown ? "chevron.up" : "chevron.down"}
            android_material_icon_name={showBreakdown ? "expand-less" : "expand-more"}
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {showBreakdown && !hideBreakdownToggle && (
        <View style={styles.breakdown}>
          {pillars.map(({ meta, score }) => (
            <View key={meta.key} style={styles.breakRow}>
              <View style={styles.breakLeft}>
                <View style={[styles.breakDot, { backgroundColor: meta.c }]} />
                <Text style={styles.breakLabel}>{meta.label}</Text>
              </View>
              <Text style={[styles.breakVal, { color: meta.c }]}>{Math.round(score)}%</Text>
            </View>
          ))}
          <View style={styles.breakDivider} />
          <View style={styles.breakRow}>
            <Text style={styles.breakTotal}>Total</Text>
            <Text style={[styles.breakVal, { color: colors.text }]}>{Math.round(imanScore)}%</Text>
          </View>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  /** Home hero: no second card frame — parent supplies the inset surface */
  embeddedShell: {
    backgroundColor: "transparent",
    marginBottom: 0,
    overflow: "visible",
  },
  cardInner: {
    flex: 1,
    padding: spacing.lg,
  },
  embeddedInner: {
    padding: 0,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    gap: spacing.md,
    width: "100%",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  retryButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  ringsWrapper: {
    position: "relative",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  centerHit: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerDisc: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  centerInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  centerScoreNum: {
    fontSize: Platform.OS === "ios" ? 34 : 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: colors.text,
    letterSpacing: -1,
  },
  centerScorePct: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 1,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.smallBold,
    color: colors.textSecondary,
    fontSize: 11,
  },
  strip: {
    flexDirection: "row",
    gap: 4,
    marginTop: spacing.md,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: colors.highlight,
  },
  stripSeg: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  stripFill: {
    height: "100%",
    borderRadius: 3,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt,
  },
  warningText: {
    ...typography.bodyBold,
    flex: 1,
    fontSize: 13,
  },
  detailsBtn: {
    alignSelf: "center",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  breakdown: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  breakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  breakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  breakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakLabel: { ...typography.body, color: colors.text },
  breakVal: { ...typography.bodyBold, fontSize: 17, fontVariant: ["tabular-nums"] },
  breakDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  breakTotal: { ...typography.bodyBold, color: colors.textSecondary, fontSize: 14 },
});
