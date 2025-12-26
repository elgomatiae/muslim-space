
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  createInvite,
  getUserProfile,
  getCommunity,
} from '@/utils/localCommunityStorage';

export default function InviteUserScreen() {
  const { communityId, communityName } = useLocalSearchParams<{
    communityId: string;
    communityName: string;
  }>();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!user || !communityId) return;

    setLoading(true);
    try {
      const currentUserProfile = await getUserProfile();
      if (!currentUserProfile) {
        Alert.alert('Error', 'User profile not found');
        setLoading(false);
        return;
      }
      
      // For demo purposes, we'll create a mock invited user
      // In a real app, you'd look up the user in a user directory
      const invitedUserId = `user_${username.toLowerCase().replace(/\s/g, '_')}`;
      
      // Check if user is already a member
      const community = await getCommunity(communityId);
      if (community) {
        const existingMember = community.members.find(m => m.username === username.trim());
        if (existingMember) {
          Alert.alert('Error', 'User is already a member of this community');
          setLoading(false);
          return;
        }
      }
      
      // Create invite
      await createInvite(
        communityId,
        communityName,
        user.id,
        currentUserProfile.username,
        invitedUserId,
        username.trim()
      );

      Alert.alert(
        'Success',
        `Invite sent to ${username}!\n\nNote: In this demo, invites are stored locally. The invited user would need to use the same device to see and accept the invite.`
      );
      setUsername('');
      router.back();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', error.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite User</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="person.badge.plus"
            android_material_icon_name="person_add"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.infoTitle}>Invite to {communityName}</Text>
          <Text style={styles.infoText}>
            Enter the username of the person you want to invite to this community.
          </Text>
          <View style={styles.demoNote}>
            <Text style={styles.demoNoteText}>
              📱 Demo Mode: Invites are stored locally on this device
            </Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
          onPress={handleInvite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <React.Fragment>
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color="#fff"
              />
              <Text style={styles.inviteButtonText}>Send Invite</Text>
            </React.Fragment>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  demoNote: {
    backgroundColor: colors.highlight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  demoNoteText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    ...typography.bodyBold,
    color: '#fff',
  },
});
