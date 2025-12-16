
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface CharityEntry {
  amount: number;
  description: string;
  date: string;
}

export default function CharityTracker() {
  const [totalCharity, setTotalCharity] = useState(0);
  const [charityCount, setCharityCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadCharityData();
  }, []);

  const loadCharityData = async () => {
    try {
      const saved = await AsyncStorage.getItem('charityData');
      if (saved) {
        const entries: CharityEntry[] = JSON.parse(saved);
        const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
        setTotalCharity(total);
        setCharityCount(entries.length);
      }
    } catch (error) {
      console.log('Error loading charity data:', error);
    }
  };

  const addCharity = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const saved = await AsyncStorage.getItem('charityData');
      const entries: CharityEntry[] = saved ? JSON.parse(saved) : [];
      
      const newEntry: CharityEntry = {
        amount: parseFloat(amount),
        description: description || 'General charity',
        date: new Date().toISOString(),
      };
      
      entries.push(newEntry);
      await AsyncStorage.setItem('charityData', JSON.stringify(entries));
      
      setTotalCharity(totalCharity + newEntry.amount);
      setCharityCount(charityCount + 1);
      setAmount('');
      setDescription('');
      setModalVisible(false);
    } catch (error) {
      console.log('Error adding charity:', error);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={[colors.success, '#2E7D32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconContainer}
        >
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={20}
            color={colors.card}
          />
        </LinearGradient>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Charity Tracker</Text>
          <Text style={styles.sectionSubtitle}>{charityCount} donations</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={20}
            color={colors.card}
          />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[colors.success + '20', colors.success + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.charityCard}
      >
        <View style={styles.charityStats}>
          <View style={styles.charityStat}>
            <Text style={styles.charityStatValue}>${totalCharity.toFixed(2)}</Text>
            <Text style={styles.charityStatLabel}>Total Given</Text>
          </View>
          <View style={styles.charityStat}>
            <Text style={styles.charityStatValue}>{charityCount}</Text>
            <Text style={styles.charityStatLabel}>Times Given</Text>
          </View>
        </View>
        <Text style={styles.charityQuote}>
          "The believer's shade on the Day of Resurrection will be their charity." - Tirmidhi
        </Text>
      </LinearGradient>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Charity</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Amount ($)</Text>
              <TextInput
                style={styles.modalInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., Masjid donation"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={addCharity}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.success, '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Add Charity</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  charityCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.medium,
  },
  charityStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  charityStat: {
    flex: 1,
  },
  charityStatValue: {
    ...typography.h3,
    color: colors.success,
    fontWeight: '700',
  },
  charityStatLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  charityQuote: {
    ...typography.small,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputGroup: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  modalButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
});
