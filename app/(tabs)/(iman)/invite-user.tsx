
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
  getCommunity,
} from '@/utils/localCommunityStorage';
import {
  findUserByUsername,
  createCommunityInvite,
} from '@/services/CommunityInviteService';
import { fetchUserProfile } from '@/utils/profileSupabaseSync';

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
      Alert.alert('Error', 'Please enter a full name or email address');
      return;
    }

    if (!user || !communityId) return;

    setLoading(true);
    try {
      // Get current user's profile from Supabase
      const currentUserProfile = await fetchUserProfile(user.id);
      if (!currentUserProfile || !currentUserProfile.full_name) {
        Alert.alert('Error', 'User profile not found. Please update your profile first.');
        setLoading(false);
        return;
      }

      // Look up the invited user by full_name or email in Supabase
      // This allows inviting anyone with a profile (by name or email)
      const invitedUser = await findUserByUsername(username.trim());
      if (!invitedUser) {
        // Try to get all profiles for debugging
        const { getAllUsernames } = await import('@/services/CommunityInviteService');
        const allProfiles = await getAllUsernames();
        
        let errorMessage = `User "${username.trim()}" not found.\n\n`;
        errorMessage += 'You can invite anyone who has a profile by:\n';
        errorMessage += '• Full name (e.g., "John Doe")\n';
        errorMessage += '• Email address (e.g., "john@example.com")\n\n';
        
        if (allProfiles.length > 0) {
          const profileList = allProfiles.slice(0, 10).map(p => p.email ? `${p.name} (${p.email})` : p.name);
          errorMessage += `Available profiles (${allProfiles.length} total):\n${profileList.join('\n')}`;
          if (allProfiles.length > 10) {
            errorMessage += `\n... and ${allProfiles.length - 10} more`;
          }
        } else {
          errorMessage += 'No profiles found in database. Make sure users have signed up and have profiles.';
        }
        
        const { getErrorMessage } = require('@/utils/errorHandler');
        Alert.alert('User Not Found', getErrorMessage(error) || errorMessage);
        setLoading(false);
        return;
      }

      // Don't allow inviting yourself
      if (invitedUser.id === user.id) {
        Alert.alert('Error', 'You cannot invite yourself to a community');
        setLoading(false);
        return;
      }
      
      // Check if user is already a member
      const community = await getCommunity(communityId);
      if (community) {
        const existingMember = community.members.find(m => m.userId === invitedUser.id);
        if (existingMember) {
          Alert.alert('Error', 'User is already a member of this community');
          setLoading(false);
          return;
        }
      }
      
      // Create invite in Supabase
      await createCommunityInvite(
        communityId,
        communityName,
        user.id,
        currentUserProfile.full_name || user.email?.split('@')[0] || 'User',
        invitedUser.id,
        invitedUser.full_name || 'User'
      );

      Alert.alert(
        'Success',
        `Invite sent to ${invitedUser.full_name || username.trim()}! They will receive a notification.`
      );
      setUsername('');
      router.back();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      if (error.message?.includes('already exists')) {
        Alert.alert('Error', 'An invite has already been sent to this user');
      } else {
        const { getErrorMessage } = require('@/utils/errorHandler');
        Alert.alert('Error', getErrorMessage(error) || 'Failed to send invite. Please try again.');
      }
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
            Enter the full name or email of anyone with a profile to invite them to this community.
          </Text>
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteText}>
              💡 You can search by full name or email address
            </Text>
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Full Name or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name or email"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
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
  infoNote: {
    backgroundColor: colors.highlight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  infoNoteText: {
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
