
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
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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
      // Find user by username
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', username.trim())
        .single();

      if (userError || !userData) {
        Alert.alert('Error', 'User not found');
        setLoading(false);
        return;
      }

      // Check if user is already a member
      const { data: memberData, error: memberError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userData.user_id)
        .single();

      if (memberData) {
        Alert.alert('Error', 'User is already a member of this community');
        setLoading(false);
        return;
      }

      // Check if invite already exists
      const { data: inviteData, error: inviteCheckError } = await supabase
        .from('community_invites')
        .select('id, status')
        .eq('community_id', communityId)
        .eq('invited_user_id', userData.user_id)
        .single();

      if (inviteData) {
        if (inviteData.status === 'pending') {
          Alert.alert('Error', 'An invite has already been sent to this user');
        } else {
          Alert.alert('Error', 'This user has already responded to an invite');
        }
        setLoading(false);
        return;
      }

      // Create invite
      const { error: createError } = await supabase
        .from('community_invites')
        .insert({
          community_id: communityId,
          invited_by: user.id,
          invited_user_id: userData.user_id,
          status: 'pending',
        });

      if (createError) throw createError;

      Alert.alert('Success', 'Invite sent successfully!');
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
