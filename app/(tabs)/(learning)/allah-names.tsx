import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { ALLAH_NAMES_99, type AllahNameEntry } from "@/data/allahNames";
import { useImanTracker } from "@/contexts/ImanTrackerContext";
import * as Haptics from "expo-haptics";
import { useAccessGate } from "@/hooks/useAccessGate";
import { AccessGate } from "@/components/access/AccessGate";

export default function AllahNamesScreen() {
  const insets = useSafeAreaInsets();
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const { checkAccess, showGate, gateVisible, onGateClose, onGateGranted } = useAccessGate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AllahNameEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALLAH_NAMES_99;
    return ALLAH_NAMES_99.filter((n) => {
      const blob = `${n.id} ${n.arabic} ${n.transliteration} ${n.english} ${n.meaning} ${n.definition}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query]);

  const goal = ilmGoals?.weeklyAllahNamesGoal ?? 0;
  const completed = ilmGoals?.weeklyAllahNamesCompleted ?? 0;
  const capped = goal > 0 && completed >= goal;

  const onTrackReview = async () => {
    if (!ilmGoals || goal <= 0 || capped) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await updateIlmGoals({
      ...ilmGoals,
      weeklyAllahNamesCompleted: Math.min(completed + 1, goal),
    });
  };

  const onSelectName = async (name: AllahNameEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const hasAccess = await checkAccess();
    if (hasAccess) {
      setSelected(name);
      return;
    }
    showGate(() => setSelected(name));
  };

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(140, insets.bottom + 120) }]}
      >
        <LinearGradient colors={["#0EA5E9", "#0284C7", "#0369A1"] as const} style={styles.hero}>
          <Text style={styles.heroTitle}>The 99 Names of Allah</Text>
          <Text style={styles.heroSub}>
            Learn, reflect, and live by Asma ul Husna with meanings, definitions, Qur'an and Hadith references.
          </Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{ALLAH_NAMES_99.length} Names</Text>
          </View>
        </LinearGradient>

        <View style={styles.searchWrap}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, meaning, or number..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Goal: {completed}/{goal} reviewed this week
          </Text>
          <Pressable
            onPress={onTrackReview}
            disabled={goal <= 0 || capped}
            style={({ pressed }) => [
              styles.trackChip,
              (goal <= 0 || capped) && styles.trackChipDisabled,
              pressed && !(goal <= 0 || capped) && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.trackChipText}>{capped ? "Goal complete" : "Track review"}</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {filtered.map((name) => (
            <Pressable key={name.id} onPress={() => void onSelectName(name)} style={styles.card}>
              <Text style={styles.cardIndex}>#{name.id}</Text>
              <Text style={styles.cardArabic}>{name.arabic}</Text>
              <Text style={styles.cardTranslit}>{name.transliteration}</Text>
              <Text style={styles.cardMeaning}>{name.english}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected ? (
          <SafeAreaView style={styles.modalRoot} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
                <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={22} color={colors.text} />
              </Pressable>

              <LinearGradient colors={["#0891B2", "#0E7490"] as const} style={styles.modalHero}>
                <Text style={styles.modalIndex}>#{selected.id}</Text>
                <Text style={styles.modalArabic}>{selected.arabic}</Text>
                <Text style={styles.modalTranslit}>{selected.transliteration}</Text>
                <Text style={styles.modalMeaning}>{selected.english}</Text>
              </LinearGradient>

              <Section title="Meaning">
                <Text style={styles.modalBody}>{selected.meaning}</Text>
              </Section>

              <Section title="Definition">
                <Text style={styles.modalBody}>{selected.definition}</Text>
              </Section>

              <Section title="Qur'an Reference">
                <Text style={styles.quoteText}>"{selected.quranQuote.text}"</Text>
                <Text style={styles.quoteSource}>{selected.quranQuote.source}</Text>
              </Section>

              {selected.hadithQuote ? (
                <Section title="Hadith Reference">
                  <Text style={styles.quoteText}>"{selected.hadithQuote.text}"</Text>
                  <Text style={styles.quoteSource}>{selected.hadithQuote.source}</Text>
                </Section>
              ) : null}

              <View style={styles.bottomTrackWrap}>
                <Pressable
                  onPress={onTrackReview}
                  disabled={goal <= 0 || capped}
                  style={({ pressed }) => [
                    styles.bottomTrackBtn,
                    (goal <= 0 || capped) && styles.bottomTrackBtnDisabled,
                    pressed && !(goal <= 0 || capped) && { opacity: 0.92 },
                  ]}
                >
                  <LinearGradient
                    colors={
                      goal <= 0 || capped
                        ? (["#94a3b8", "#64748b"] as const)
                        : (["#8B5CF6", "#6366F1", "#3B82F6"] as const)
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bottomTrackGradient}
                  >
                    <IconSymbol
                      ios_icon_name={capped ? "checkmark.circle.fill" : "bookmark.fill"}
                      android_material_icon_name={capped ? "check-circle" : "bookmark"}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.bottomTrackText}>
                      {goal <= 0
                        ? "Enable Allah Names goal in settings"
                        : capped
                          ? "Goal complete for this week"
                          : "Mark this name as reviewed"}
                    </Text>
                  </LinearGradient>
                </Pressable>
                <Text style={styles.bottomTrackHint}>
                  Progress: {completed}/{goal}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>

      <AccessGate
        visible={gateVisible}
        onClose={onGateClose}
        onAccessGranted={onGateGranted}
        title="Unlock Allah Names"
        description="Watch a short ad to unlock Asma ul Husna for 24 hours"
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { borderRadius: borderRadius.xxxl, padding: spacing.xl, ...shadows.colored },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: spacing.sm },
  heroSub: { ...typography.body, color: "rgba(255,255,255,0.95)", lineHeight: 22 },
  heroBadge: { marginTop: spacing.md, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.22)", borderRadius: borderRadius.round, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  heroBadgeText: { ...typography.smallBold, color: "#fff" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.md },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressText: { ...typography.caption, color: colors.textSecondary },
  trackChip: { backgroundColor: colors.primary, borderRadius: borderRadius.round, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  trackChipDisabled: { opacity: 0.5 },
  trackChipText: { ...typography.smallBold, color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" },
  card: { width: "47%", backgroundColor: colors.card, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadows.card },
  cardIndex: { ...typography.captionBold, color: colors.primary, marginBottom: spacing.xs },
  cardArabic: { fontSize: 24, lineHeight: 34, color: colors.text, textAlign: "right", marginBottom: spacing.xs },
  cardTranslit: { ...typography.bodyBold, color: colors.text },
  cardMeaning: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  closeBtn: {
    alignSelf: "flex-end",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalHero: { borderRadius: borderRadius.xxxl, padding: spacing.xl, marginBottom: spacing.md },
  modalIndex: { ...typography.captionBold, color: "rgba(255,255,255,0.9)" },
  modalArabic: { fontSize: 42, lineHeight: 56, color: "#fff", textAlign: "center", marginTop: spacing.sm },
  modalTranslit: { ...typography.h3, color: "#fff", textAlign: "center", marginTop: spacing.sm },
  modalMeaning: { ...typography.bodyBold, color: "rgba(255,255,255,0.95)", textAlign: "center", marginTop: spacing.xs },
  section: { backgroundColor: colors.card, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
  modalBody: { ...typography.body, color: colors.text, lineHeight: 24 },
  quoteText: { ...typography.body, color: colors.text, fontStyle: "italic", lineHeight: 24, marginBottom: spacing.xs },
  quoteSource: { ...typography.caption, color: colors.textSecondary },
  bottomTrackWrap: { marginTop: spacing.sm, marginBottom: spacing.xl },
  bottomTrackBtn: { borderRadius: borderRadius.xl, overflow: "hidden", ...shadows.medium },
  bottomTrackBtnDisabled: { opacity: 0.7 },
  bottomTrackGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  bottomTrackText: { ...typography.bodyBold, color: "#fff" },
  bottomTrackHint: { ...typography.caption, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm },
});

