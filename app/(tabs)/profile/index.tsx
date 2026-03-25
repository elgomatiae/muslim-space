
import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius, shadows } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from 'expo-haptics';
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/I18nContext";
import { syncProfileFromSupabase, updateUserProfile, deleteUserAccount } from "@/utils/profileSupabaseSync";
import { router } from "expo-router";
import { TabHubHeader, TabHubHeaderIconDecoration } from "@/components/navigation/TabHubHeader";

interface ProfileOption {
  title: string;
  iosIcon: string;
  androidIcon: string;
  color: string;
  action: () => void;
}

interface UserProfile {
  name: string;
  email: string;
}

const ADMIN_PIN = "2218";
const TAP_THRESHOLD = 10;
const TAP_TIMEOUT = 3000;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.user_metadata?.username || user?.email?.split('@')[0] || "User",
    email: user?.email || "user@example.com",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      if (user) {
        await syncProfileFromSupabase(user.id);
      }

      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setTempProfile(parsedProfile);
      } else if (user) {
        const userProfile = {
          name: user.user_metadata?.username || user.email?.split('@')[0] || "User",
          email: user.email || "user@example.com",
        };
        setProfile(userProfile);
        setTempProfile(userProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Auto-save profile changes to Supabase (debounced)
  const autoSaveProfile = useCallback(async (updatedProfile: UserProfile) => {
    if (!user) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingProfile(true);
        console.log('💾 Auto-saving profile changes...');
        
        // Save to local storage
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        
        // Save to Supabase - use full_name (your schema column)
        await updateUserProfile(user.id, {
          full_name: updatedProfile.name,
          email: updatedProfile.email?.trim(),
        });
        
        console.log('✅ Profile auto-saved successfully');
      } catch (error) {
        console.error('❌ Error auto-saving profile:', error);
      } finally {
        setSavingProfile(false);
      }
    }, 1000); // Wait 1 second after last change before saving
  }, [user]);

  const saveProfile = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Clear any pending auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(tempProfile));
      setProfile(tempProfile);
      
      if (user) {
        setSavingProfile(true);
        await updateUserProfile(user.id, {
          full_name: tempProfile.name, // Use full_name from your schema
          email: tempProfile.email?.trim(),
        });
        setSavingProfile(false);
      }
      
      setEditModalVisible(false);
    } catch (error) {
      console.log('Error saving profile:', error);
      setSavingProfile(false);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleUsernameTap = () => {
    const currentTime = Date.now();
    
    if (currentTime - lastTapTime > TAP_TIMEOUT) {
      setTapCount(1);
      setLastTapTime(currentTime);
      return;
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    setLastTapTime(currentTime);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    console.log(`Username tapped: ${newTapCount}/${TAP_THRESHOLD}`);

    if (newTapCount >= TAP_THRESHOLD) {
      setTapCount(0);
      setPinModalVisible(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  };

  const handlePinSubmit = () => {
    console.log('PIN submitted:', pinInput);
    console.log('Expected PIN:', ADMIN_PIN);
    console.log('PIN match:', pinInput === ADMIN_PIN);
    
    Keyboard.dismiss();
    
    if (pinInput === ADMIN_PIN) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setPinModalVisible(false);
      setPinInput('');
      
      setTimeout(() => {
        console.log('Navigating to health check screen');
        try {
          router.push('/(tabs)/profile/health-check');
          console.log('Navigation to health check executed successfully');
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Error', 'Failed to open health check. Please try again.');
        }
      }, 300);
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Access Denied', 'Incorrect PIN. Please try again.');
      setPinInput('');
    }
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempProfile(profile);
    setEditModalVisible(true);
  };

  const handleNotifications = () => {
    console.log('=== NOTIFICATION NAVIGATION START (Android/Web with Stack) ===');
    console.log('Platform:', Platform.OS);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      console.log('Attempting to navigate to notification-settings within profile stack');
      router.push('/(tabs)/profile/notification-settings');
      console.log('Navigation command executed successfully');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('common.error'), t('profile.navigationError'));
    }
    
    console.log('=== NOTIFICATION NAVIGATION END ===');
  };


  const handleAbout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      router.push('/(tabs)/profile/about');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('common.error'), t('profile.navigationError'));
    }
  };

  const handleLanguage = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      router.push('/(tabs)/profile/language-settings');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t('common.error'), t('profile.navigationError'));
    }
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.logout'), 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            
            try {
              // Delete user profile from Supabase
              const success = await deleteUserAccount(user.id);
              
              if (success) {
                // Sign out the user
                await signOut();
                
                Alert.alert(
                  t('profile.accountDeleted'),
                  t('profile.accountDeletedSuccess'),
                  [{ text: t('common.ok') }]
                );
              } else {
                // Even if deletion fails, sign out and show message
                await signOut();
                Alert.alert(
                  t('profile.accountDeletion'),
                  t('profile.accountDeletionProcessing'),
                  [{ text: t('common.ok') }]
                );
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(t('common.error'), t('profile.failedToDeleteAccount'));
            }
          }
        }
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    { 
      title: t('profile.editProfile'), 
      iosIcon: 'pencil', 
      androidIcon: 'edit', 
      color: colors.primary,
      action: handleEditProfile
    },
    { 
      title: t('profile.notifications'), 
      iosIcon: 'bell', 
      androidIcon: 'notifications', 
      color: colors.accent,
      action: handleNotifications
    },
    { 
      title: t('profile.language'), 
      iosIcon: 'globe', 
      androidIcon: 'language', 
      color: colors.secondary,
      action: handleLanguage
    },
    { 
      title: t('profile.about'), 
      iosIcon: 'info.circle', 
      androidIcon: 'info', 
      color: colors.secondary,
      action: handleAbout
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1, paddingBottom: 32 }}>
        <TabHubHeader
          title={t("profile.title")}
          subtitle={t("profile.settings")}
          left={
            <TabHubHeaderIconDecoration>
              <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={22} color={colors.primary} />
            </TabHubHeaderIconDecoration>
          }
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={88}
              color={colors.card}
            />
          </View>
          <TouchableOpacity 
            onPress={handleUsernameTap}
            activeOpacity={0.9}
          >
            <Text style={styles.name}>{profile.name}</Text>
          </TouchableOpacity>
          <Text style={styles.email}>{profile.email}</Text>
          <TouchableOpacity 
            style={styles.editButton} 
            activeOpacity={0.7}
            onPress={handleEditProfile}
          >
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.infoContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="person.text.rectangle"
                android_material_icon_name="contact-mail"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>{t('profile.contactInformation')}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={22}
                color={colors.primary}
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('profile.email')}</Text>
                <Text style={styles.infoText}>{profile.email}</Text>
              </View>
            </View>
            
            
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <IconSymbol
                ios_icon_name="gear"
                android_material_icon_name="settings"
                size={22}
                color={colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          </View>
          {profileOptions.map((option, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={option.action}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIconContainer, { backgroundColor: option.color }]}>
                    <IconSymbol
                      ios_icon_name={option.iosIcon}
                      android_material_icon_name={option.androidIcon}
                      size={24}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <IconSymbol
            ios_icon_name="rectangle.portrait.and.arrow.right"
            android_material_icon_name="logout"
            size={22}
            color={colors.error}
          />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteAccountButton} 
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
        >
          <IconSymbol
            ios_icon_name="trash.fill"
            android_material_icon_name="delete"
            size={20}
            color={colors.error}
          />
          <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('profile.name')}</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfile.name}
                  onChangeText={(text) => {
                    const updated = {...tempProfile, name: text};
                    setTempProfile(updated);
                    autoSaveProfile(updated);
                  }}
                  placeholder={t('profile.enterYourName')}
                  placeholderTextColor={colors.textSecondary}
                />
                {savingProfile && (
                  <Text style={styles.savingIndicator}>💾 {t('profile.saving')}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('profile.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={tempProfile.email}
                  placeholder={t('profile.enterYourEmail')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={true}
                  onChangeText={(text) => {
                    const updated = { ...tempProfile, email: text };
                    setTempProfile(updated);
                    autoSaveProfile(updated);
                  }}
                />
              </View>


              <View style={styles.autoSaveNotice}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.success || colors.primary}
                />
                <Text style={styles.autoSaveNoticeText}>{t('profile.changesAreSavedAutomatically')}</Text>
              </View>

              <TouchableOpacity 
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setPinModalVisible(false);
          setPinInput('');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.pinModalOverlay}
        >
          <TouchableOpacity 
            style={styles.pinModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
            }}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.pinModalContent}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pinModalHeader}
                >
                  <IconSymbol
                    ios_icon_name="lock.shield.fill"
                    android_material_icon_name="admin-panel-settings"
                    size={48}
                    color={colors.card}
                  />
                  <Text style={styles.pinModalTitle}>Admin Access</Text>
                  <Text style={styles.pinModalSubtitle}>Enter PIN to continue</Text>
                </LinearGradient>

                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={styles.pinInput}
                    value={pinInput}
                    onChangeText={setPinInput}
                    placeholder="Enter 4-digit PIN"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handlePinSubmit}
                  />
                </View>

                <View style={styles.pinButtonContainer}>
                  <TouchableOpacity
                    style={styles.pinCancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setPinModalVisible(false);
                      setPinInput('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pinCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pinSubmitButton, pinInput.length !== 4 && styles.pinSubmitButtonDisabled]}
                    onPress={handlePinSubmit}
                    activeOpacity={0.7}
                    disabled={pinInput.length !== 4}
                  >
                    <LinearGradient
                      colors={pinInput.length === 4 ? ['#EF4444', '#DC2626'] : [colors.border, colors.border]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.pinSubmitGradient}
                    >
                      <IconSymbol
                        ios_icon_name="lock.open.fill"
                        android_material_icon_name="lock-open"
                        size={20}
                        color={colors.card}
                      />
                      <Text style={styles.pinSubmitButtonText}>Unlock</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  profileHeader: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.card,
    opacity: 0.95,
    marginBottom: spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  editButtonText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  infoContainer: {
    marginBottom: spacing.xxxl,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  optionsContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  optionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.error,
    ...shadows.medium,
  },
  logoutText: {
    ...typography.h4,
    color: colors.error,
  },
  deleteAccountButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  deleteAccountText: {
    ...typography.h4,
    color: colors.error,
  },
  bottomPadding: {
    height: 120,
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
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalScroll: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: colors.border,
  },
  inputHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  savingIndicator: {
    ...typography.small,
    color: colors.primary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  autoSaveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  autoSaveNoticeText: {
    ...typography.caption,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  saveButtonText: {
    ...typography.h4,
    color: colors.card,
  },
  cancelButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  pinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModalBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pinModalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...shadows.large,
  },
  pinModalHeader: {
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  pinModalTitle: {
    ...typography.h2,
    color: colors.card,
    textAlign: 'center',
  },
  pinModalSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    textAlign: 'center',
  },
  pinInputContainer: {
    padding: spacing.xl,
  },
  pinInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    letterSpacing: 8,
  },
  pinButtonContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  pinCancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinCancelButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  pinSubmitButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  pinSubmitButtonDisabled: {
    opacity: 0.5,
  },
  pinSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  pinSubmitButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
});
