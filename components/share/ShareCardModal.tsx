/**
 * ============================================================================
 * SHARE CARD MODAL
 * ============================================================================
 * 
 * Modal that displays a share card and provides sharing options
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { getScreenWidth, getScreenHeight } from '@/utils/screenDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { useTranslation } from '@/contexts/I18nContext';
import ShareCard from './ShareCard';
import { ShareCardData } from '@/utils/shareCardGenerator';
import { shareCard, shareToInstagramStories, shareToWhatsApp, shareToSnapchat } from '@/utils/shareService';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = getScreenWidth();
const SCREEN_HEIGHT = getScreenHeight();

interface ShareCardModalProps {
  visible: boolean;
  data: ShareCardData;
  onClose: () => void;
}

export default function ShareCardModal({ visible, data, onClose }: ShareCardModalProps) {
  const { t } = useTranslation();
  const cardRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);
  
  // Animations
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(SCREEN_HEIGHT), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.8), []);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const handleShare = async (platform?: 'instagram' | 'whatsapp' | 'snapchat') => {
    if (!cardRef.current) {
      Alert.alert('Error', 'Card is not ready. Please try again.');
      return;
    }

    setSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (platform === 'instagram') {
        await shareToInstagramStories(cardRef, data);
      } else if (platform === 'whatsapp') {
        await shareToWhatsApp(cardRef, data);
      } else if (platform === 'snapchat') {
        await shareToSnapchat(cardRef, data);
      } else {
        await shareCard(cardRef, data);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(t('common.error'), t('share.unableToShare'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Your Achievement</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Card Preview */}
          <ScrollView
            contentContainerStyle={styles.cardContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.cardWrapper}>
              <ShareCard
                ref={cardRef}
                data={data}
                width={SCREEN_WIDTH * 0.9}
                height={SCREEN_WIDTH * 0.9 * 1.777}
              />
              {/* Interactive hint */}
              <View style={styles.cardHint}>
                <IconSymbol
                  ios_icon_name="hand.tap.fill"
                  android_material_icon_name="touch-app"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.cardHintText}>Tap to share</Text>
              </View>
            </View>
          </ScrollView>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <Text style={styles.shareOptionsTitle}>Share to:</Text>
            
            <View style={styles.shareButtons}>
              {/* General Share */}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare()}
                disabled={sharing}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'DD']}
                  style={styles.shareButtonGradient}
                >
                  {sharing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="square.and.arrow.up"
                        android_material_icon_name="share"
                        size={24}
                        color="#FFFFFF"
                      />
                      <Text style={styles.shareButtonText}>Share</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Instagram Stories */}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare('instagram')}
                disabled={sharing}
              >
                <LinearGradient
                  colors={['#E4405F', '#C13584', '#833AB4']}
                  style={styles.shareButtonGradient}
                >
                  {sharing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="camera.fill"
                        android_material_icon_name="camera-alt"
                        size={24}
                        color="#FFFFFF"
                      />
                      <Text style={styles.shareButtonText}>Instagram</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare('whatsapp')}
                disabled={sharing}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.shareButtonGradient}
                >
                  {sharing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="message.fill"
                        android_material_icon_name="chat"
                        size={24}
                        color="#FFFFFF"
                      />
                      <Text style={styles.shareButtonText}>WhatsApp</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Snapchat */}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare('snapchat')}
                disabled={sharing}
              >
                <LinearGradient
                  colors={['#FFFC00', '#FFF700']}
                  style={styles.shareButtonGradient}
                >
                  {sharing ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="camera.fill"
                        android_material_icon_name="camera-alt"
                        size={24}
                        color="#000000"
                      />
                      <Text style={[styles.shareButtonText, { color: '#000000' }]}>Snapchat</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    ...shadows.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing.xs,
  },
  cardContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
    position: 'relative',
  },
  cardHint: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  cardHintText: {
    ...typography.caption,
    fontSize: 12,
    color: '#FFFFFF',
  },
  shareOptions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareOptionsTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  shareButtonText: {
    ...typography.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
