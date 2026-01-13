
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
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getAllCommunities,
  getUserCommunities,
  createCommunity,
  updateUserImanScore,
  updateAllMemberScores,
  saveCommunities,
  getUserImanScore,
  LocalCommunity,
} from '@/utils/localCommunityStorage';
import { fetchUserProfile } from '@/utils/profileSupabaseSync';

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

  // Debug: Log communities state whenever it changes
  useEffect(() => {
    console.log(`📊 Communities state changed: ${communities.length} communities in state`);
    if (communities.length > 0) {
      communities.forEach((c, idx) => {
        console.log(`   ${idx + 1}. "${c.name}" (ID: ${c.id}, ${c.members.length} members)`);
      });
    }
  }, [communities]);

  const loadCommunities = useCallback(async () => {
    if (!user?.id) {
      console.log('ℹ️ No user logged in, skipping community load');
      setCommunities([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('📥 Loading communities for user:', user.id);
      
      // Update user's Iman score (this ensures communities have the latest score)
      try {
        await updateUserImanScore(user.id);
        console.log('✅ User Iman score updated');
      } catch (error) {
        console.log('ℹ️ Iman score update skipped:', error);
      }
      
      // Load communities the user is a member of FIRST (show them immediately)
      let userCommunities = await getUserCommunities(user.id);
      console.log(`📊 getUserCommunities returned ${userCommunities.length} communities for user ${user.id}`);
      
      // If no communities found, check if there are any communities in storage at all
      // and try to fix any ID mismatches
      if (userCommunities.length === 0) {
        console.log(`   ⚠️ NO COMMUNITIES FOUND - checking storage directly...`);
        const allComms = await getAllCommunities();
        console.log(`   📦 Total communities in AsyncStorage: ${allComms.length}`);
        
        if (allComms.length > 0) {
          console.log(`   🔍 Attempting to fix ID mismatches...`);
          // Try to match communities where user might be creator but ID format is different
          const fixedCommunities: LocalCommunity[] = [];
          
          for (const comm of allComms) {
            // Try multiple ID comparison methods
            const creatorMatches = String(comm.createdBy).trim() === String(user.id).trim();
            const hasMatchingMember = comm.members.some(m => String(m.userId).trim() === String(user.id).trim());
            
            if (creatorMatches || hasMatchingMember) {
              console.log(`   ✅ Found matching community: "${comm.name}" (creator match: ${creatorMatches}, member match: ${hasMatchingMember})`);
              
              // If user is creator but not in members, add them
              if (creatorMatches && !hasMatchingMember) {
                try {
                  const profile = await fetchUserProfile(user.id);
                  const username = profile?.full_name || 'User';
                  const imanScore = await getUserImanScore(user.id);
                  
                  comm.members.unshift({
                    userId: user.id,
                    username: username,
                    role: 'admin',
                    joinedAt: comm.createdAt,
                    hideScore: false,
                    imanScore: imanScore,
                  });
                  
                  // Save the fix
                  const allCommsToSave = await getAllCommunities();
                  const idx = allCommsToSave.findIndex(c => c.id === comm.id);
                  if (idx >= 0) {
                    allCommsToSave[idx] = comm;
                    await saveCommunities(allCommsToSave);
                    console.log(`   ✅ Fixed and saved "${comm.name}"`);
                  }
                } catch (error) {
                  console.error(`   ❌ Error fixing community:`, error);
                }
              }
              
              fixedCommunities.push(comm);
            }
          }
          
          if (fixedCommunities.length > 0) {
            console.log(`   🎉 Found ${fixedCommunities.length} communities after fixing ID mismatches!`);
            userCommunities = fixedCommunities;
          } else {
            // Last resort: show ALL communities if user created any of them (by checking if any creator ID matches any part of user ID)
            console.log(`   🔄 Last resort: checking if user might have created any communities...`);
            allComms.forEach((c, idx) => {
              console.log(`      Community ${idx + 1}: "${c.name}"`);
              console.log(`         Created by: "${c.createdBy}" (type: ${typeof c.createdBy})`);
              console.log(`         Current user: "${user.id}" (type: ${typeof user.id})`);
              console.log(`         Exact match: ${c.createdBy === user.id}`);
              console.log(`         String match: ${String(c.createdBy) === String(user.id)}`);
              console.log(`         Trimmed match: ${String(c.createdBy).trim() === String(user.id).trim()}`);
            });
          }
        } else {
          console.log(`   📭 AsyncStorage is empty - no communities have been created yet`);
        }
      } else {
        console.log(`   ✅ Communities found:`, userCommunities.map(c => `"${c.name}" (${c.members.length} members)`));
      }
      
      // Set communities immediately so they're visible right away (even if empty)
      console.log(`🔄 Setting communities state with ${userCommunities.length} communities`);
      setCommunities(userCommunities);
      setLoading(false); // Stop loading as soon as we have results
      console.log(`✅ Communities state updated with ${userCommunities.length} communities, loading set to false`);
      
      // Update all member scores in background (non-blocking)
      // This updates scores in-place and saves to storage
      for (const community of userCommunities) {
        try {
          await updateAllMemberScores(community.id);
        } catch (error) {
          console.warn(`⚠️ Could not update scores for community ${community.id}:`, error);
        }
      }
      
      // Reload communities after score updates to get the latest data
      const updatedCommunities = await getUserCommunities(user.id);
      setCommunities(updatedCommunities);
      
      console.log(`✅ Successfully loaded and displayed ${updatedCommunities.length} communities with updated scores`);
    } catch (error) {
      console.error('❌ Error loading communities:', error);
      // Don't show alert - just log the error
      console.log('ℹ️ Communities will be empty until created');
      setCommunities([]);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]); // Only depend on user.id to avoid unnecessary re-renders

  const fetchPendingInvites = useCallback(async () => {
    if (!user?.id) {
      console.log('ℹ️ No user logged in, skipping invites fetch');
      return;
    }

    try {
      console.log('📥 Fetching pending invites for user:', user.id);
      const { getPendingInvitesCount } = await import('@/services/CommunityInviteService');
      const count = await getPendingInvitesCount(user.id);
      setPendingInvitesCount(count);
      console.log(`✅ Successfully fetched ${count} pending invites`);
    } catch (error) {
      console.log('ℹ️ Error fetching pending invites (non-critical):', error);
      // Fallback to local storage count
      try {
        const { getPendingInvitesCount: getLocalCount } = await import('@/utils/localCommunityStorage');
        const localCount = await getLocalCount(user.id);
        setPendingInvitesCount(localCount);
      } catch {
        setPendingInvitesCount(0);
      }
    }
  }, [user?.id]);

  // Load communities immediately when component mounts and user is available
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Component mounted, loading communities immediately for user:', user.id);
      // Call loadCommunities directly to ensure it runs
      loadCommunities().catch(err => {
        console.error('Failed to load communities on mount:', err);
      });
      fetchPendingInvites().catch(err => {
        console.error('Failed to fetch invites on mount:', err);
      });
    } else {
      console.log('⚠️ No user ID available, cannot load communities');
      setCommunities([]);
      setLoading(false);
    }
  }, [user?.id, loadCommunities, fetchPendingInvites]); // Include callbacks to ensure they're current

  // Reload communities when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('🔄 Screen focused, reloading communities...');
        loadCommunities();
        fetchPendingInvites();
      }
    }, [user?.id])
  );

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
      
      // Get current user's profile from Supabase to get correct full_name
      const profile = await fetchUserProfile(user.id);
      if (!profile) {
        Alert.alert('Error', 'User profile not found. Please update your profile first.');
        setCreating(false);
        return;
      }
      
      // Use full_name from Supabase profile (this is the correct username)
      const creatorName = profile.full_name || profile.email?.split('@')[0] || user.email?.split('@')[0] || 'User';
      console.log('👤 Creating community as:', creatorName, '(ID:', user.id, ')');
      
      await createCommunity(
        newCommunityName.trim(),
        newCommunityDescription.trim() || null,
        user.id, // Current logged-in user's ID
        creatorName // Current logged-in user's full_name from Supabase
      );

      // Reload communities IMMEDIATELY after creation to show the new community
      await loadCommunities();
      
      Alert.alert('Success', 'Community created successfully!');
      setNewCommunityName('');
      setNewCommunityDescription('');
      setShowCreateModal(false);
      
      console.log('✅ Community created successfully and reloaded');
    } catch (error: any) {
      console.error('❌ Failed to create community:', error);
      const { getErrorMessage } = require('@/utils/errorHandler');
      Alert.alert('Error', getErrorMessage(error) || 'Failed to create community. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient Effect */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={20}
                color={colors.text}
              />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Communities</Text>
            {communities.length > 0 && (
              <Text style={styles.headerSubtitle}>{communities.length} {communities.length === 1 ? 'community' : 'communities'}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.invitesButton}
            onPress={() => router.push('/(tabs)/(iman)/invites-inbox')}
            activeOpacity={0.7}
          >
            <View style={styles.invitesButtonCircle}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="mail"
                size={20}
                color={colors.primary}
              />
              {pendingInvitesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading && communities.length === 0 && !showCreateModal && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading communities...</Text>
          </View>
        )}

        {/* Create Community Floating Button - Always visible when modal is closed */}
        {!showCreateModal && (
          <TouchableOpacity
            style={styles.floatingCreateButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.floatingButtonContent}>
              <View style={styles.floatingButtonIcon}>
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={24}
                  color="#fff"
                />
              </View>
              <Text style={styles.floatingButtonText}>Create Community</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <View style={styles.createModalContainer}>
            <View style={styles.createModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.createModalTitle}>Create New Community</Text>
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => {
                    setShowCreateModal(false);
                    setNewCommunityName('');
                    setNewCommunityDescription('');
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Community Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter community name"
                  placeholderTextColor={colors.textSecondary}
                  value={newCommunityName}
                  onChangeText={setNewCommunityName}
                  maxLength={50}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your community..."
                  placeholderTextColor={colors.textSecondary}
                  value={newCommunityDescription}
                  onChangeText={setNewCommunityDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.createModalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateModal(false);
                    setNewCommunityName('');
                    setNewCommunityDescription('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.confirmButton,
                    (!newCommunityName.trim() || creating) && styles.confirmButtonDisabled
                  ]}
                  onPress={handleCreateCommunity}
                  disabled={!newCommunityName.trim() || creating}
                  activeOpacity={0.8}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Communities Grid */}
        {communities.length > 0 && (
          <View style={styles.communitiesSection}>
            <Text style={styles.sectionTitle}>Your Communities</Text>
            <View style={styles.communitiesGrid}>
              {communities.map((community, index) => {
                const userMember = community.members.find(m => m.userId === user?.id);
                const isAdmin = userMember?.role === 'admin';
                const avgScore = community.members.length > 0
                  ? Math.round(
                      community.members.reduce((sum, m) => sum + (m.imanScore || 0), 0) /
                      community.members.length
                    )
                  : 0;
                
                return (
                  <TouchableOpacity
                    key={community.id || index}
                    style={styles.communityCard}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/(iman)/community-detail',
                        params: { communityId: community.id },
                      })
                    }
                    activeOpacity={0.9}
                  >
                    <View style={styles.communityCardHeader}>
                      <View style={styles.communityIconContainer}>
                        <View style={styles.communityIconGradient}>
                          <IconSymbol
                            ios_icon_name="person.3.fill"
                            android_material_icon_name="groups"
                            size={28}
                            color={colors.primary}
                          />
                        </View>
                        {isAdmin && (
                          <View style={styles.adminBadgeAbsolute}>
                            <IconSymbol
                              ios_icon_name="crown.fill"
                              android_material_icon_name="star"
                              size={14}
                              color="#FFD700"
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.communityCardContent}>
                      <Text style={styles.communityName} numberOfLines={1}>
                        {community.name}
                      </Text>
                      
                      {community.description && (
                        <Text style={styles.communityDescription} numberOfLines={2}>
                          {community.description}
                        </Text>
                      )}

                      <View style={styles.communityStats}>
                        <View style={styles.statItem}>
                          <IconSymbol
                            ios_icon_name="person.2.fill"
                            android_material_icon_name="people"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.statText}>
                            {community.members.length}
                          </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <IconSymbol
                            ios_icon_name="chart.line.uptrend.xyaxis"
                            android_material_icon_name="trending-up"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.statText}>{avgScore}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.communityCardFooter}>
                      <View style={styles.communityCardArrow}>
                        <IconSymbol
                          ios_icon_name="chevron.right"
                          android_material_icon_name="chevron-right"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Enhanced Empty State */}
        {communities.length === 0 && !loading && !showCreateModal && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconContainer}>
              <View style={styles.emptyStateIconCircle}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="groups"
                  size={48}
                  color={colors.primary}
                />
              </View>
            </View>
            <Text style={styles.emptyStateTitle}>No Communities Yet</Text>
            <Text style={styles.emptyStateText}>
              Start building your community network by creating your first community or accepting invites from others
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={20}
                color="#fff"
              />
              <Text style={styles.emptyStateButtonText}>Create Your First Community</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingTop: 48,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    fontSize: 24,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invitesButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitesButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: borderRadius.round,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: {
    ...typography.small,
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
  },
  
  // Floating Create Button
  floatingCreateButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    ...shadows.large,
    overflow: 'hidden',
  },
  floatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  floatingButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    ...typography.h4,
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Create Modal
  createModalContainer: {
    marginBottom: spacing.xl,
  },
  createModal: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  createModalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    fontSize: 22,
    flex: 1,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  createModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    ...typography.bodyBold,
    color: '#fff',
    fontSize: 16,
  },

  // Communities Section
  communitiesSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: spacing.lg,
  },
  communitiesGrid: {
    gap: spacing.lg,
  },
  communityCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityCardHeader: {
    marginBottom: spacing.md,
  },
  communityIconContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  communityIconGradient: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadgeAbsolute: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.small,
  },
  communityCardContent: {
    marginBottom: spacing.md,
  },
  communityName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  communityDescription: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  communityCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  communityCardArrow: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIconContainer: {
    marginBottom: spacing.xl,
  },
  emptyStateIconCircle: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.round,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.medium,
  },
  emptyStateButtonText: {
    ...typography.bodyBold,
    color: '#fff',
    fontSize: 16,
  },
  
  // Bottom Padding
  bottomPadding: {
    height: spacing.xxxl,
  },
});
