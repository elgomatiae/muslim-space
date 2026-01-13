import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import VideoPlayer from '@/components/VideoPlayer';
import { 
  fetchAllRecitations, 
  fetchRecitationsByCategory, 
  getRecitationCategories, 
  searchRecitations, 
  incrementRecitationViews,
  type RecitationDisplay 
} from '@/services/RecitationService';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImanTracker } from '@/contexts/ImanTrackerContext';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';

// Helper functions
function isSupabaseConfigured(): boolean {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key);
  } catch {
    return false;
  }
}

function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

function getYouTubeWatchUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname.includes('/watch')) {
      return url;
    }
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
  } catch {
    return url;
  }
}

function getYouTubeThumbnailUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let videoId = '';
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.pathname.includes('/watch')) {
      videoId = urlObj.searchParams.get('v') || '';
    }
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return '';
  } catch {
    return '';
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function RecitationsScreen() {
  const { user } = useAuth();
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<string[]>([]);
  const [recitationsByCategory, setRecitationsByCategory] = useState<{ [key: string]: RecitationDisplay[] }>({});
  const [uncategorizedRecitations, setUncategorizedRecitations] = useState<RecitationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecitation, setSelectedRecitation] = useState<RecitationDisplay | null>(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecitationDisplay[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [pendingRecitation, setPendingRecitation] = useState<RecitationDisplay | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const configured = isSupabaseConfigured();
    setSupabaseEnabled(configured);

    if (!configured) {
      console.warn('⚠️ Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      console.log('🎵 Loading recitations...');
      const allRecitations = await fetchAllRecitations();
      
      console.log(`✅ Fetched ${allRecitations.length} recitations`);
      
      if (allRecitations.length === 0) {
        console.warn('⚠️ No recitations found. Make sure:');
        console.warn('   1. Tables exist (run migration 008)');
        console.warn('   2. Data imported (run migration 009)');
        console.warn('   3. RLS policies allow SELECT');
      }
      
      // Separate categorized and uncategorized
      const categorized: { [key: string]: RecitationDisplay[] } = {};
      const uncategorized: RecitationDisplay[] = [];
      
      // Ensure ALL recitations are processed
      allRecitations.forEach(recitation => {
        if (recitation.category && recitation.category.trim() !== '' && recitation.category !== 'Uncategorized') {
          if (!categorized[recitation.category]) {
            categorized[recitation.category] = [];
          }
          categorized[recitation.category].push(recitation);
        } else {
          uncategorized.push(recitation);
        }
      });
      
      // Sort recitations within each category by order_index, then by title
      Object.keys(categorized).forEach(category => {
        categorized[category].sort((a, b) => {
          if (a.order_index !== b.order_index) {
            return a.order_index - b.order_index;
          }
          return a.title.localeCompare(b.title);
        });
      });
      
      // Sort categories by name for consistent display
      const uniqueCategories = Object.keys(categorized).sort((a, b) => {
        // Prioritize main categories
        const priority = ['Quran & Tafsir', 'Motivational', 'Emotional'];
        const aPriority = priority.indexOf(a);
        const bPriority = priority.indexOf(b);
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        return a.localeCompare(b);
      });
      
      // Sort uncategorized by order_index
      uncategorized.sort((a, b) => {
        if (a.order_index !== b.order_index) {
          return a.order_index - b.order_index;
        }
        return a.title.localeCompare(b.title);
      });
      
      setCategories(uniqueCategories);
      setRecitationsByCategory(categorized);
      setUncategorizedRecitations(uncategorized);
      
      console.log(`✅ Loaded: ${allRecitations.length} recitations, ${uniqueCategories.length} categories, ${uncategorized.length} uncategorized`);
    } catch (error) {
      console.error('❌ Error loading recitations:', error);
      Alert.alert('Error', 'Failed to load recitations. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchRecitations(searchQuery);
      setSearchResults(results);
      console.log(`🔍 Found ${results.length} results for "${searchQuery}"`);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch && searchQuery.trim()) {
        performSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, performSearch]);

  const trackRecitation = async (recitation: RecitationDisplay) => {
    if (!user) return;
    
    try {
      await incrementRecitationViews(recitation.id);
      
      // Track in tracked_content table if it exists
      try {
        await supabase.from('tracked_content').insert({
          user_id: user.id,
          content_type: 'recitation',
          content_id: recitation.id,
          title: recitation.title,
        });
      } catch (err) {
        // Table might not exist, that's okay
        console.debug('Could not track in tracked_content:', err);
      }

      // Update ilm goals
      if (ilmGoals) {
        const updatedGoals = {
          ...ilmGoals,
          weeklyRecitationsCompleted: Math.min(
            (ilmGoals.weeklyRecitationsCompleted || 0) + 1,
            ilmGoals.weeklyRecitationsGoal || 10
          ),
        };
        await updateIlmGoals(updatedGoals);
      }

      // Track recitation completion for achievements (treat as lecture for achievement purposes)
      if (user) {
        try {
          const { trackLectureCompletion } = await import('@/utils/imanActivityIntegration');
          await trackLectureCompletion(user.id);
        } catch (error) {
          console.log('Error tracking recitation:', error);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error tracking recitation:', error);
    }
  };

  const openYouTubeVideo = async (recitation: RecitationDisplay) => {
    try {
      const youtubeUrl = getYouTubeWatchUrl(recitation.url);
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      
      if (canOpen) {
        await WebBrowser.openBrowserAsync(youtubeUrl, {
          dismissButtonStyle: 'close',
          readerMode: false,
        });
      } else {
        await Linking.openURL(youtubeUrl);
      }
    } catch (error) {
      console.error('Error opening video:', error);
      Alert.alert('Error', 'Could not open video. Please try again.');
    }
  };

  const handleRecitationPress = async (recitation: RecitationDisplay) => {
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
      setShowTrackingModal(false);
      const recitation = pendingRecitation;
      setPendingRecitation(null);
      await trackRecitation(recitation);
      await openYouTubeVideo(recitation);
    }
  };

  const handleWatchWithoutTracking = async () => {
    if (pendingRecitation) {
      setShowTrackingModal(false);
      const recitation = pendingRecitation;
      setPendingRecitation(null);
      await openYouTubeVideo(recitation);
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

  if (selectedRecitation) {
    return (
      <VideoPlayer 
        video={{
          id: selectedRecitation.id,
          title: selectedRecitation.title,
          description: undefined,
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.setupBanner}>
            <IconSymbol ios_icon_name="cloud.fill" android_material_icon_name="cloud" size={48} color={colors.card} />
            <Text style={styles.setupTitle}>Connect to Supabase</Text>
            <Text style={styles.setupDescription}>
              To access Quran recitations, please configure Supabase in your .env file.
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.emptyCard}>
            <IconSymbol ios_icon_name="music.note.slash" android_material_icon_name="headset-off" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Recitations Yet</Text>
            <Text style={styles.emptyText}>
              Quran recitations will appear here once they are added to your Supabase database.
              {'\n\n'}
              Run migrations:
              {'\n'}1. 008_create_lectures_recitations_tables.sql
              {'\n'}2. 009_import_lectures_recitations.sql
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Hero Header Section */}
        <LinearGradient
          colors={colors.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { marginTop: insets.top + spacing.sm }]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIconContainer}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroIconGradient}
                >
                  <IconSymbol
                    ios_icon_name="music.note.list"
                    android_material_icon_name="library-music"
                    size={40}
                    color={colors.card}
                  />
                </LinearGradient>
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Quran Recitations</Text>
                <Text style={styles.heroSubtitle}>
                  {totalRecitations} recitation{totalRecitations !== 1 ? 's' : ''} • {categories.length} categories
                </Text>
              </View>
              <TouchableOpacity style={styles.searchButtonHero} onPress={handleSearchToggle} activeOpacity={0.7}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.searchButtonGradient}
                >
                  <IconSymbol
                    ios_icon_name={showSearch ? 'xmark' : 'magnifyingglass'}
                    android_material_icon_name={showSearch ? 'close' : 'search'}
                    size={22}
                    color={colors.card}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchContainerHero}>
                <View style={styles.searchInputContainerHero}>
                  <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.card} />
                  <TextInput
                    style={styles.searchInputHero}
                    placeholder="Search recitations, reciters..."
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                      <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.card} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {showSearch && searchQuery.trim().length > 0 ? (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.searchResultsTitle}>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
                <View style={styles.searchResultsList}>
                  {searchResults.map((recitation) => {
                    const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                    return (
                      <TouchableOpacity
                        key={recitation.id}
                        style={styles.searchResultItem}
                        onPress={() => handleRecitationPress(recitation)}
                        activeOpacity={0.7}
                      >
                        {thumbnailUrl ? (
                          <Image source={{ uri: thumbnailUrl }} style={styles.searchResultThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.searchResultThumbnail, styles.placeholderThumbnail]}>
                            <IconSymbol ios_icon_name="music.note" android_material_icon_name="headset" size={24} color={colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>{recitation.title}</Text>
                          {recitation.reciter_name && <Text style={styles.searchResultSubtitle}>{recitation.reciter_name}</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchText}>No results found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {uncategorizedRecitations.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryHeaderLeft}>
                    <View style={styles.categoryIconContainer}>
                      <LinearGradient
                        colors={colors.gradientPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryIconGradient}
                      >
                        <IconSymbol ios_icon_name="square.grid.2x2" android_material_icon_name="apps" size={18} color={colors.card} />
                      </LinearGradient>
                    </View>
                    <View>
                      <Text style={styles.categoryTitle}>Uncategorized</Text>
                      <Text style={styles.categoryCount}>{uncategorizedRecitations.length} recitations</Text>
                    </View>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                  {uncategorizedRecitations.map((recitation) => {
                    const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                    return (
                      <TouchableOpacity
                        key={recitation.id}
                        style={styles.recitationCard}
                        onPress={() => handleRecitationPress(recitation)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.recitationCardImageContainer}>
                          {thumbnailUrl ? (
                            <Image source={{ uri: thumbnailUrl }} style={styles.recitationThumbnail} resizeMode="cover" />
                          ) : (
                            <LinearGradient
                              colors={colors.gradientOcean}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.recitationThumbnail}
                            >
                              <IconSymbol ios_icon_name="music.note" android_material_icon_name="headset" size={40} color={colors.card} />
                            </LinearGradient>
                          )}
                          <View style={styles.playButtonOverlay}>
                            <LinearGradient
                              colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={styles.playButtonGradient}
                            >
                              <IconSymbol ios_icon_name="play.circle.fill" android_material_icon_name="play-circle-filled" size={36} color={colors.card} />
                            </LinearGradient>
                          </View>
                        </View>
                        <View style={styles.recitationCardContent}>
                          <Text style={styles.recitationCardTitle} numberOfLines={2}>{recitation.title}</Text>
                          {recitation.reciter_name && (
                            <View style={styles.reciterInfo}>
                              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={14} color={colors.textSecondary} />
                              <Text style={styles.recitationCardSubtitle} numberOfLines={1}>{recitation.reciter_name}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {categories.map((category) => {
              const recitations = recitationsByCategory[category] || [];
              if (recitations.length === 0) return null;
              
              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryHeaderLeft}>
                      <View style={styles.categoryIconContainer}>
                        <LinearGradient
                          colors={colors.gradientPrimary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.categoryIconGradient}
                        >
                          <IconSymbol ios_icon_name="folder.fill" android_material_icon_name="folder" size={18} color={colors.card} />
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <Text style={styles.categoryCount}>{recitations.length} recitations</Text>
                      </View>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                    {recitations.map((recitation) => {
                      const thumbnailUrl = recitation.image_url || (recitation.url ? getYouTubeThumbnailUrl(recitation.url) : '');
                      return (
                        <TouchableOpacity
                          key={recitation.id}
                          style={styles.recitationCard}
                          onPress={() => handleRecitationPress(recitation)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.recitationCardImageContainer}>
                            {thumbnailUrl ? (
                              <Image source={{ uri: thumbnailUrl }} style={styles.recitationThumbnail} resizeMode="cover" />
                            ) : (
                              <LinearGradient
                                colors={colors.gradientOcean}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.recitationThumbnail}
                              >
                                <IconSymbol ios_icon_name="music.note" android_material_icon_name="headset" size={40} color={colors.card} />
                              </LinearGradient>
                            )}
                            <View style={styles.playButtonOverlay}>
                              <LinearGradient
                                colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.playButtonGradient}
                              >
                                <IconSymbol ios_icon_name="play.circle.fill" android_material_icon_name="play-circle-filled" size={36} color={colors.card} />
                              </LinearGradient>
                            </View>
                          </View>
                          <View style={styles.recitationCardContent}>
                            <Text style={styles.recitationCardTitle} numberOfLines={2}>{recitation.title}</Text>
                            {recitation.reciter_name && (
                              <View style={styles.reciterInfo}>
                                <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={14} color={colors.textSecondary} />
                                <Text style={styles.recitationCardSubtitle} numberOfLines={1}>{recitation.reciter_name}</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {showTrackingModal && pendingRecitation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Track This Recitation?</Text>
            <Text style={styles.modalText}>
              Would you like to track this recitation for your learning goals?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.trackButton]} onPress={handleTrackAndWatch} activeOpacity={0.7}>
                <Text style={styles.trackButtonText}>Track & Watch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.watchButton]} onPress={handleWatchWithoutTracking} activeOpacity={0.7}>
                <Text style={styles.watchButtonText}>Watch Only</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  contentContainer: { padding: spacing.md },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  heroSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  heroContent: {
    padding: spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  heroIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.card,
    fontWeight: '800',
    marginBottom: spacing.xs / 2,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    fontSize: 14,
  },
  searchButtonHero: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainerHero: {
    marginTop: spacing.md,
  },
  searchInputContainerHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInputHero: {
    flex: 1,
    ...typography.body,
    color: colors.card,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  searchResultsContainer: { marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  searchLoadingContainer: { alignItems: 'center', padding: spacing.xl },
  searchLoadingText: { marginTop: spacing.sm, color: colors.textSecondary },
  searchResultsTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md, fontWeight: '700' },
  searchResultsList: { gap: spacing.md },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
    marginBottom: spacing.sm,
  },
  searchResultThumbnail: { width: 120, height: 68, borderRadius: borderRadius.md, marginRight: spacing.md },
  searchResultContent: { flex: 1, justifyContent: 'center' },
  searchResultTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.xs / 2 },
  searchResultSubtitle: { ...typography.caption, color: colors.textSecondary },
  emptySearchContainer: { padding: spacing.xl, alignItems: 'center' },
  emptySearchText: { ...typography.body, color: colors.textSecondary },
  categorySection: {
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  categoryIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  horizontalScroll: {
    marginHorizontal: -spacing.lg,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  recitationCard: {
    width: 240,
    marginRight: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.medium,
  },
  recitationCardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  recitationThumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recitationCardContent: {
    padding: spacing.md,
  },
  recitationCardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 15,
    lineHeight: 20,
  },
  reciterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  recitationCardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  setupBanner: { padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', gap: spacing.md },
  setupTitle: { ...typography.h2, color: colors.card, textAlign: 'center' },
  setupDescription: { ...typography.body, color: colors.card, textAlign: 'center', opacity: 0.9 },
  emptyCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', ...shadows.small },
  emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, width: '85%', ...shadows.large },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  modalText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  trackButton: { backgroundColor: colors.primary },
  trackButtonText: { ...typography.body, color: colors.card, fontWeight: '600' },
  watchButton: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  watchButtonText: { ...typography.body, color: colors.text, fontWeight: '600' },
  bottomPadding: {
    height: spacing.xxl,
  },
});
