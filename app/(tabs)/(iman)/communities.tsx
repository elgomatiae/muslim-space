
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getUserCommunities,
  createCommunity,
  getPendingInvitesCount,
  updateUserImanScore,
  getUserProfile,
  saveUserProfile,
  LocalCommunity,
} from '@/utils/localCommunityStorage';

export default function CommunitiesScreen() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<LocalCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const loadCommunities = useCallback(async () => {
    if (!user) {
      console.log('ℹ️ No user logged in, skipping community load');
      setCommunities([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('📥 Loading communities for user:', user.id);
      
      // Update user's Iman score
      try {
        await updateUserImanScore(user.id);
        console.log('✅ User Iman score updated');
      } catch (error) {
        console.log('ℹ️ Iman score update skipped:', error);
      }
      
      // Load communities
      const userCommunities = await getUserCommunities(user.id);
      setCommunities(userCommunities);
      
      console.log(`✅ Successfully loaded ${userCommunities.length} communities`);
    } catch (error) {
      console.error('❌ Error loading communities:', error);
      // Don't show alert - just log the error
      console.log('ℹ️ Communities will be empty until created');
      setCommunities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const fetchPendingInvites = useCallback(async () => {
    if (!user) {
      console.log('ℹ️ No user logged in, skipping invites fetch');
      return;
    }

    try {
      console.log('📥 Fetching pending invites for user:', user.id);
      const count = await getPendingInvitesCount(user.id);
      setPendingInvitesCount(count);
      console.log(`✅ Successfully fetched ${count} pending invites`);
    } catch (error) {
      console.log('ℹ️ Error fetching pending invites (non-critical):', error);
      setPendingInvitesCount(0);
    }
  }, [user]);

  useEffect(() => {
    const initializeUser = async () => {
      if (user) {
        try {
          // Ensure user profile exists
          const profile = await getUserProfile();
          if (!profile) {
            console.log('📝 Creating user profile...');
            await saveUserProfile({
              userId: user.id,
              username: user.email?.split('@')[0] || 'User',
              email: user.email || '',
            });
            console.log('✅ User profile created');
          } else {
            console.log('✅ User profile exists');
          }
        } catch (error) {
          console.log('ℹ️ Error initializing user profile:', error);
        }
      }
    };
    
    initializeUser();
    loadCommunities();
    fetchPendingInvites();
  }, [loadCommunities, fetchPendingInvites, user]);

  const onRefresh = useCallback(() => {
    console.log('🔄 Refreshing communities...');
    setRefreshing(true);
    loadCommunities();
    fetchPendingInvites();
  }, [loadCommunities, fetchPendingInvites]);

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a community');
      return;
    }

    setCreating(true);
    try {
      console.log('🏗️ Creating community:', newCommunityName);
      
      const profile = await getUserProfile();
      const username = profile?.username || user.email?.split('@')[0] || 'User';
      
      await createCommunity(
        newCommunityName.trim(),
        newCommunityDescription.trim() || null,
        user.id,
        username
      );

      Alert.alert('Success', 'Community created successfully!');
      setNewCommunityName('');
      setNewCommunityDescription('');
      setShowCreateModal(false);
      loadCommunities();
      
      console.log('✅ Community created successfully');
    } catch (error: any) {
      console.error('❌ Failed to create community:', error);
      Alert.alert('Error', error.message || 'Failed to create community. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Communities</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity
          style={styles.invitesButton}
          onPress={() => router.push('/(tabs)/(iman)/invites-inbox')}
        >
          <IconSymbol
            ios_icon_name="envelope.fill"
            android_material_icon_name="mail"
            size={24}
            color={colors.primary}
          />
          {pendingInvitesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!showCreateModal ? (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add_circle"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.createButtonText}>Create New Community</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.createModal}>
            <Text style={styles.createModalTitle}>Create Community</Text>
            <TextInput
              style={styles.input}
              placeholder="Community Name"
              placeholderTextColor={colors.textSecondary}
              value={newCommunityName}
              onChangeText={setNewCommunityName}
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newCommunityDescription}
              onChangeText={setNewCommunityDescription}
              maxLength={200}
              multiline
              numberOfLines={3}
            />
            <View style={styles.createModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewCommunityName('');
                  setNewCommunityDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateCommunity}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {communities.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="groups"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Communities Yet</Text>
            <Text style={styles.emptyStateText}>
              Create a community or wait for an invite to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.communitiesList}>
            {communities.map((community, index) => {
              const userMember = community.members.find(m => m.userId === user?.id);
              const isAdmin = userMember?.role === 'admin';
              
              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={styles.communityCard}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/(iman)/community-detail',
                        params: { communityId: community.id },
                      })
                    }
                  >
                    <View style={styles.communityIcon}>
                      <IconSymbol
                        ios_icon_name="person.3.fill"
                        android_material_icon_name="groups"
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.communityInfo}>
                      <View style={styles.communityHeader}>
                        <Text style={styles.communityName}>{community.name}</Text>
                        {isAdmin && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      {community.description && (
                        <Text style={styles.communityDescription} numberOfLines={1}>
                          {community.description}
                        </Text>
                      )}
                      <Text style={styles.communityMembers}>
                        {community.members.length} {community.members.length === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  invitesButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: borderRadius.round,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
    gap: spacing.md,
  },
  createButtonText: {
    ...typography.h4,
    color: colors.primary,
  },
  createModal: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.large,
  },
  createModalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.bodyBold,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  communitiesList: {
    gap: spacing.md,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
    gap: spacing.md,
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  communityName: {
    ...typography.h4,
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  adminBadgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
  },
  communityDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  communityMembers: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
