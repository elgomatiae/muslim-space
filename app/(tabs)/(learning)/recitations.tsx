
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, Alert, Modal, Image } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import VideoPlayer from '@/components/VideoPlayer';
import { 
  fetchRecitations, 
  fetchRecitationsByCategory, 
  getRecitationCategories, 
  searchRecitations, 
  incrementRecitationViews,
  isSupabaseConfigured, 
  isYouTubeUrl, 
  getYouTubeWatchUrl,
  getYouTubeThumbnailUrl,
  Recitation 
} from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export default function RecitationsScreen() {
  const { user } = useAuth();
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const [categories, setCategories] = useState<string[]>([]);
  const [recitationsByCategory, setRecitationsByCategory] = useState<{ [key: string]: Recitation[] }>({});
  const [uncategorizedRecitations, setUncategorizedRecitations] = useState<Recitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recitation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [pendingRecitation, setPendingRecitation] = useState<Recitation | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const configured = isSupabaseConfigured();
    setSupabaseEnabled(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all recitations first
      const allRecitations = await fetchRecitations();
      
      // Separate categorized and uncategorized recitations
      const categorized: { [key: string]: Recitation[] } = {};
      const uncategorized: Recitation[] = [];
      
      allRecitations.forEach(recitation => {
        if (recitation.category && recitation.category.trim() !== '') {
          if (!categorized[recitation.category]) {
            categorized[recitation.category] = [];
          }
          categorized[recitation.category].push(recitation);
        } else {
          uncategorized.push(recitation);
        }
      });
      
      // Get unique categories
      const uniqueCategories = Object.keys(categorized).sort();
      
      setCategories(uniqueCategories);
      setRecitationsByCategory(categorized);
      setUncategorizedRecitations(uncategorized);
      
      console.log(`Loaded ${allRecitations.length} recitations: ${uniqueCategories.length} categories, ${uncategorized.length} uncategorized`);
    } catch (error) {
      console.error('Error loading recitations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const performSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const results = await searchRecitations(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching recitations:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, performSearch]);

  const trackRecitation = async (recitation: Recitation) => {
    if (!user) {
      console.log('User not logged in, skipping tracking');
      return;
    }

    try {
      const { error } = await supabase
        .from('tracked_content')
        .upsert({
          user_id: user.id,
          content_type: 'recitation',
          video_id: recitation.id,
          video_title: recitation.title,
          video_url: recitation.url,
          reciter_name: recitation.reciter_name,
          tracked_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id'
        });

      if (error) {
        console.error('Error tracking recitation:', error);
        Alert.alert('Error', 'Failed to track recitation. Please try again.');
        return;
      }

      if (ilmGoals) {
        const updatedGoals = {
          ...ilmGoals,
          weeklyRecitationsCompleted: Math.min(
            ilmGoals.weeklyRecitationsCompleted + 1,
            ilmGoals.weeklyRecitationsGoal
          ),
        };
        await updateIlmGoals(updatedGoals);
      }

      console.log('Recitation tracked successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error tracking recitation:', error);
    }
  };

  const openYouTubeVideo = async (recitation: Recitation) => {
    try {
      const youtubeUrl = getYouTubeWatchUrl(recitation.url);
      console.log('Opening YouTube video:', youtubeUrl);
      await WebBrowser.openBrowserAsync(youtubeUrl);
    } catch (error) {
      console.error('Error opening YouTube video:', error);
      Alert.alert('Error', 'Could not open YouTube video. Please try again.');
    }
  };

  const handleRecitationPress = async (recitation: Recitation) => {
    await incrementRecitationViews(recitation.id);

    if (isYouTubeUrl(recitation.url)) {
      setPendingRecitation(recitation);
      setShowTrackingModal(true);
    } else {
      setSelectedRecitation(recitation);
    }
  };

  const handleTrackAndWatch = async () => {
    if (pendingRecitation) {
      const recitationToOpen = pendingRecitation;
      await trackRecitation(pendingRecitation);
      setShowTrackingModal(false);
      setPendingRecitation(null);
      
      // Add a small delay to ensure modal is fully closed before opening browser
      setTimeout(async () => {
        await openYouTubeVideo(recitationToOpen);
      }, 300);
    }
  };

  const handleWatchWithoutTracking = async () => {
    if (pendingRecitation) {
      const recitationToOpen = pendingRecitation;
      setShowTrackingModal(false);
      setPendingRecitation(null);
      
      // Add a small delay to ensure modal is fully closed before opening browser
      setTimeout(async () => {
        await openYouTubeVideo(recitationToOpen);
      }, 300);
    }
  };

  const handleCloseVideo = () => {
    setSelectedRecitation(null);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      setSearchResults([]);
      Keyboard.dismiss();
    }
  };

  const handleImportPlaylist = () => {
    router.push('/(tabs)/(learning)/playlist-import?type=recitation');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  if (selectedRecitation) {
    return (
      <VideoPlayer 
        video={{
          id: selectedRecitation.id,
          title: selectedRecitation.title,
          description: selectedRecitation.description,
          thumbnail_url: selectedRecitation.image_url,
          video_url: selectedRecitation.url,
          reciter_name: selectedRecitation.reciter_name,
          views: selectedRecitation.views,
        }} 
        onClose={handleCloseVideo} 
      />
    );
  }

  if (!supabaseEnabled) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.setupBanner}
          >
            <View style={styles.setupIconContainer}>
              <IconSymbol
                ios_icon_name="cloud.fill"
                android_material_icon_name="cloud"
                size={48}
                color={colors.card}
              />
            </View>
            <Text style={styles.setupTitle}>Connect to Supabase</Text>
            <Text style={styles.setupDescription}>
              To access Quran recitations, please enable Supabase by pressing the Supabase button and connecting to your project.
            </Text>
          </LinearGradient>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading recitations...</Text>
      </View>
    );
  }

  const totalRecitations = categories.reduce((sum, cat) => sum + (recitationsByCategory[cat]?.length || 0), 0) + uncategorizedRecitations.length;

  if (totalRecitations === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <IconSymbol
                ios_icon_name="music.note.slash"
                android_material_icon_name="headset-off"
                size={64}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No Recitations Yet</Text>
            <Text style={styles.emptyText}>
              Import a YouTube playlist to get started. Tap the import button above to begin.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleImportPlaylist}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <IconSymbol
                  ios_icon_name="square.and.arrow.down.fill"
                  android_material_icon_name="download"
                  size={20}
                  color={colors.card}
                />
                <Text style={styles.emptyButtonText}>Import Playlist</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quran Recitations</Text>
            <Text style={styles.headerSubtitle}>
              {totalRecitations} recitation{totalRecitations !== 1 ? 's' : ''} • {categories.length} categories
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImportPlaylist}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.down"
                android_material_icon_name="download"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchToggle}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={showSearch ? 'xmark' : 'magnifyingglass'}
                android_material_icon_name={showSearch ? 'close' : 'search'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol
                ios_icon_name="magnifyingglass"
                android_material_icon_name="search"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recitations, reciters..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <React.Fragment>
                <Text style={styles.searchResultsTitle}>
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </Text>
                <View style={styles.searchResultsList}>
                  {searchResults.map((recitation, index) => {
                    const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.searchResultItem}
                        onPress={() => handleRecitationPress(recitation)}
                        activeOpacity={0.7}
                      >
                        {thumbnailUrl ? (
                          <View style={styles.searchResultThumbnailContainer}>
                            <Image 
                              source={{ uri: thumbnailUrl }} 
                              style={styles.searchResultThumbnailImage}
                              resizeMode="cover"
                            />
                            <View style={styles.searchPlayOverlay}>
                              <IconSymbol
                                ios_icon_name="play.circle.fill"
                                android_material_icon_name="play-circle"
                                size={32}
                                color={colors.card}
                              />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.searchResultThumbnail}>
                            <IconSymbol
                              ios_icon_name="play.circle.fill"
                              android_material_icon_name="play-circle"
                              size={32}
                              color={colors.primary}
                            />
                          </View>
                        )}
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>
                            {recitation.title}
                          </Text>
                          {recitation.reciter_name && (
                            <Text style={styles.searchResultScholar} numberOfLines={1}>
                              {recitation.reciter_name}
                            </Text>
                          )}
                          <View style={styles.searchResultMeta}>
                            {recitation.category && (
                              <Text style={styles.searchResultCategory}>{recitation.category}</Text>
                            )}
                            <Text style={styles.searchResultViews}>{recitation.category ? ' • ' : ''}{recitation.views || 0} views</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </React.Fragment>
            ) : (
              <View style={styles.noResultsContainer}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsText}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </View>
        ) : (
          <React.Fragment>
            {/* Show uncategorized recitations */}
            {uncategorizedRecitations.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>Recently Added</Text>
                  <Text style={styles.categoryCount}>{uncategorizedRecitations.length} recitations</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recitationsRow}
                >
                  {uncategorizedRecitations.map((recitation, recitationIndex) => {
                    const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                    return (
                      <TouchableOpacity
                        key={recitationIndex}
                        style={styles.recitationCard}
                        onPress={() => handleRecitationPress(recitation)}
                        activeOpacity={0.7}
                      >
                        {thumbnailUrl ? (
                          <View style={styles.recitationThumbnailContainer}>
                            <Image 
                              source={{ uri: thumbnailUrl }} 
                              style={styles.recitationThumbnailImage}
                              resizeMode="cover"
                            />
                            <View style={styles.playOverlay}>
                              <IconSymbol
                                ios_icon_name="play.circle.fill"
                                android_material_icon_name="play-circle"
                                size={40}
                                color={colors.card}
                              />
                            </View>
                          </View>
                        ) : (
                          <View style={styles.recitationThumbnail}>
                            <IconSymbol
                              ios_icon_name="play.circle.fill"
                              android_material_icon_name="play-circle"
                              size={40}
                              color={colors.primary}
                            />
                          </View>
                        )}
                        <View style={styles.recitationInfo}>
                          <Text style={styles.recitationTitle} numberOfLines={2}>
                            {recitation.title}
                          </Text>
                          {recitation.reciter_name && (
                            <Text style={styles.recitationReciter} numberOfLines={1}>
                              {recitation.reciter_name}
                            </Text>
                          )}
                          <Text style={styles.recitationViews}>{recitation.views || 0} views</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Show categorized recitations */}
            {categories.map((category, catIndex) => {
              const recitations = recitationsByCategory[category] || [];
              if (recitations.length === 0) return null;

              return (
                <View key={catIndex} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.categoryCount}>{recitations.length} recitations</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recitationsRow}
                  >
                    {recitations.map((recitation, recitationIndex) => {
                      const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                      return (
                        <TouchableOpacity
                          key={recitationIndex}
                          style={styles.recitationCard}
                          onPress={() => handleRecitationPress(recitation)}
                          activeOpacity={0.7}
                        >
                          {thumbnailUrl ? (
                            <View style={styles.recitationThumbnailContainer}>
                              <Image 
                                source={{ uri: thumbnailUrl }} 
                                style={styles.recitationThumbnailImage}
                                resizeMode="cover"
                              />
                              <View style={styles.playOverlay}>
                                <IconSymbol
                                  ios_icon_name="play.circle.fill"
                                  android_material_icon_name="play-circle"
                                  size={40}
                                  color={colors.card}
                                />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.recitationThumbnail}>
                              <IconSymbol
                                ios_icon_name="play.circle.fill"
                                android_material_icon_name="play-circle"
                                size={40}
                                color={colors.primary}
                              />
                            </View>
                          )}
                          <View style={styles.recitationInfo}>
                            <Text style={styles.recitationTitle} numberOfLines={2}>
                              {recitation.title}
                            </Text>
                            {recitation.reciter_name && (
                              <Text style={styles.recitationReciter} numberOfLines={1}>
                                {recitation.reciter_name}
                              </Text>
                            )}
                            <Text style={styles.recitationViews}>{recitation.views || 0} views</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </React.Fragment>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showTrackingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.modalTitle}>Track in Iman Tracker?</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Would you like to track this Quran recitation in your Iman Tracker under ʿIlm (Knowledge)?
              </Text>
              {pendingRecitation && (
                <View style={styles.videoPreview}>
                  <Text style={styles.videoPreviewTitle} numberOfLines={2}>
                    {pendingRecitation.title}
                  </Text>
                  {pendingRecitation.reciter_name && (
                    <Text style={styles.videoPreviewScholar}>
                      by {pendingRecitation.reciter_name}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleWatchWithoutTracking}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonSecondaryText}>No, Just Watch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleTrackAndWatch}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.modalButtonPrimaryText}>Track & Watch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 56 : 20,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  importButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  searchContainer: {
    marginTop: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchResultsContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  searchLoadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  searchResultsTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  searchResultsList: {
    gap: spacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  searchResultThumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  searchResultThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    position: 'relative',
  },
  searchResultThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  searchPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  searchResultScholar: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultCategory: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  searchResultViews: {
    ...typography.small,
    color: colors.textSecondary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  noResultsTitle: {
    ...typography.h4,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  noResultsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  setupBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.colored,
  },
  setupIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  setupTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  setupDescription: {
    ...typography.body,
    color: colors.card,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  categorySection: {
    marginBottom: spacing.xxl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.text,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  recitationsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  recitationCard: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  recitationThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recitationThumbnailContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  recitationThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recitationInfo: {
    padding: spacing.md,
  },
  recitationTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
    minHeight: 40,
  },
  recitationReciter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recitationViews: {
    ...typography.small,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...shadows.large,
  },
  modalHeader: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalBody: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  videoPreview: {
    backgroundColor: colors.backgroundAlt,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  videoPreviewTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  videoPreviewScholar: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalButtonSecondary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  modalButtonPrimaryText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
