import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, Alert, Image } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import VideoPlayer from '@/components/VideoPlayer';
import { 
  fetchAllLectures, 
  fetchLecturesByCategory, 
  getLectureCategories, 
  searchLectures, 
  incrementLectureViews,
  type LectureDisplay 
} from '@/services/LectureService';
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

export default function LecturesScreen() {
  const { user } = useAuth();
  const { ilmGoals, updateIlmGoals } = useImanTracker();
  const [categories, setCategories] = useState<string[]>([]);
  const [lecturesByCategory, setLecturesByCategory] = useState<{ [key: string]: LectureDisplay[] }>({});
  const [uncategorizedLectures, setUncategorizedLectures] = useState<LectureDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<LectureDisplay | null>(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LectureDisplay[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [pendingLecture, setPendingLecture] = useState<LectureDisplay | null>(null);

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
      console.log('📚 Loading lectures...');
      const allLectures = await fetchAllLectures();
      
      console.log(`✅ Fetched ${allLectures.length} lectures`);
      
      if (allLectures.length === 0) {
        console.warn('⚠️ No lectures found. Make sure:');
        console.warn('   1. Tables exist (run migration 008)');
        console.warn('   2. Data imported (run migration 009)');
        console.warn('   3. RLS policies allow SELECT');
      }
      
      // Separate categorized and uncategorized
      const categorized: { [key: string]: LectureDisplay[] } = {};
      const uncategorized: LectureDisplay[] = [];
      
      allLectures.forEach(lecture => {
        if (lecture.category && lecture.category.trim() !== '') {
          if (!categorized[lecture.category]) {
            categorized[lecture.category] = [];
          }
          categorized[lecture.category].push(lecture);
        } else {
          uncategorized.push(lecture);
        }
      });
      
      // Shuffle within categories
      Object.keys(categorized).forEach(category => {
        categorized[category] = shuffleArray(categorized[category]);
      });
      
      const uniqueCategories = Object.keys(categorized).sort();
      
      setCategories(uniqueCategories);
      setLecturesByCategory(categorized);
      setUncategorizedLectures(shuffleArray(uncategorized));
      
      console.log(`✅ Loaded: ${allLectures.length} lectures, ${uniqueCategories.length} categories`);
    } catch (error) {
      console.error('❌ Error loading lectures:', error);
      Alert.alert('Error', 'Failed to load lectures. Please check your connection.');
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
      const results = await searchLectures(searchQuery);
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

  const trackLecture = async (lecture: LectureDisplay) => {
    if (!user) return;
    
    try {
      await incrementLectureViews(lecture.id);
      
      // Track in tracked_content table if it exists
      try {
        await supabase.from('tracked_content').insert({
          user_id: user.id,
          content_type: 'lecture',
          content_id: lecture.id,
          title: lecture.title,
        });
      } catch (err) {
        // Table might not exist, that's okay
        console.debug('Could not track in tracked_content:', err);
      }

      // Update ilm goals
      if (ilmGoals) {
        const updatedGoals = {
          ...ilmGoals,
          ilm_weekly_lectures_completed: Math.min(
            (ilmGoals.ilm_weekly_lectures_completed || 0) + 1,
            ilmGoals.ilm_weekly_lectures_goal || 10
          ),
        };
        await updateIlmGoals(updatedGoals);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error tracking lecture:', error);
    }
  };

  const openYouTubeVideo = async (lecture: LectureDisplay) => {
    try {
      const youtubeUrl = getYouTubeWatchUrl(lecture.url);
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

  const handleLecturePress = async (lecture: LectureDisplay) => {
    await incrementLectureViews(lecture.id);

    if (isYouTubeUrl(lecture.url)) {
      setPendingLecture(lecture);
      setShowTrackingModal(true);
    } else {
      setSelectedLecture(lecture);
    }
  };

  const handleTrackAndWatch = async () => {
    if (pendingLecture) {
      setShowTrackingModal(false);
      const lecture = pendingLecture;
      setPendingLecture(null);
      await trackLecture(lecture);
      await openYouTubeVideo(lecture);
    }
  };

  const handleWatchWithoutTracking = async () => {
    if (pendingLecture) {
      setShowTrackingModal(false);
      const lecture = pendingLecture;
      setPendingLecture(null);
      await openYouTubeVideo(lecture);
    }
  };

  const handleCloseVideo = () => {
    setSelectedLecture(null);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      setSearchResults([]);
      Keyboard.dismiss();
    }
  };

  if (selectedLecture) {
    return (
      <VideoPlayer 
        video={{
          id: selectedLecture.id,
          title: selectedLecture.title,
          description: undefined,
          thumbnail_url: selectedLecture.image_url,
          video_url: selectedLecture.url,
          scholar_name: selectedLecture.scholar_name,
          views: selectedLecture.views,
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
              To access Islamic lectures, please configure Supabase in your .env file.
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
        <Text style={styles.loadingText}>Loading lectures...</Text>
      </View>
    );
  }

  const totalLectures = categories.reduce((sum, cat) => sum + (lecturesByCategory[cat]?.length || 0), 0) + uncategorizedLectures.length;

  if (totalLectures === 0) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.emptyCard}>
            <IconSymbol ios_icon_name="video.slash.fill" android_material_icon_name="videocam-off" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Lectures Yet</Text>
            <Text style={styles.emptyText}>
              Islamic lectures will appear here once they are added to your Supabase database.
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
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Islamic Lectures</Text>
            <Text style={styles.headerSubtitle}>
              {totalLectures} lecture{totalLectures !== 1 ? 's' : ''} • {categories.length} categories
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchToggle} activeOpacity={0.7}>
            <IconSymbol
              ios_icon_name={showSearch ? 'xmark' : 'magnifyingglass'}
              android_material_icon_name={showSearch ? 'close' : 'search'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search lectures, scholars..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
                  {searchResults.map((lecture) => {
                    const thumbnailUrl = lecture.thumbnail_url || (lecture.url ? getYouTubeThumbnailUrl(lecture.url) : '');
                    return (
                      <TouchableOpacity
                        key={lecture.id}
                        style={styles.searchResultItem}
                        onPress={() => handleLecturePress(lecture)}
                        activeOpacity={0.7}
                      >
                        {thumbnailUrl ? (
                          <Image source={{ uri: thumbnailUrl }} style={styles.searchResultThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.searchResultThumbnail, styles.placeholderThumbnail]}>
                            <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={24} color={colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>{lecture.title}</Text>
                          {lecture.scholar_name && <Text style={styles.searchResultSubtitle}>{lecture.scholar_name}</Text>}
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
            {uncategorizedLectures.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Uncategorized</Text>
                <Text style={styles.categoryCount}>{uncategorizedLectures.length} lectures</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {uncategorizedLectures.map((lecture) => {
                    const thumbnailUrl = lecture.thumbnail_url || (lecture.url ? getYouTubeThumbnailUrl(lecture.url) : '');
                    return (
                      <TouchableOpacity
                        key={lecture.id}
                        style={styles.lectureCard}
                        onPress={() => handleLecturePress(lecture)}
                        activeOpacity={0.7}
                      >
                        {thumbnailUrl ? (
                          <Image source={{ uri: thumbnailUrl }} style={styles.lectureThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.lectureThumbnail, styles.placeholderThumbnail]}>
                            <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={32} color={colors.textSecondary} />
                          </View>
                        )}
                        <Text style={styles.lectureCardTitle} numberOfLines={2}>{lecture.title}</Text>
                        {lecture.scholar_name && <Text style={styles.lectureCardSubtitle} numberOfLines={1}>{lecture.scholar_name}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {categories.map((category) => {
              const lectures = lecturesByCategory[category] || [];
              if (lectures.length === 0) return null;
              
              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.categoryCount}>{lectures.length} lectures</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {lectures.map((lecture) => {
                      const thumbnailUrl = lecture.thumbnail_url || (lecture.url ? getYouTubeThumbnailUrl(lecture.url) : '');
                      return (
                        <TouchableOpacity
                          key={lecture.id}
                          style={styles.lectureCard}
                          onPress={() => handleLecturePress(lecture)}
                          activeOpacity={0.7}
                        >
                          {thumbnailUrl ? (
                            <Image source={{ uri: thumbnailUrl }} style={styles.lectureThumbnail} resizeMode="cover" />
                          ) : (
                            <View style={[styles.lectureThumbnail, styles.placeholderThumbnail]}>
                              <IconSymbol ios_icon_name="video.fill" android_material_icon_name="videocam" size={32} color={colors.textSecondary} />
                            </View>
                          )}
                          <Text style={styles.lectureCardTitle} numberOfLines={2}>{lecture.title}</Text>
                          {lecture.scholar_name && <Text style={styles.lectureCardSubtitle} numberOfLines={1}>{lecture.scholar_name}</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {showTrackingModal && pendingLecture && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Track This Lecture?</Text>
            <Text style={styles.modalText}>
              Would you like to track this lecture for your learning goals?
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
  headerContainer: { backgroundColor: colors.card, padding: spacing.md, ...shadows.small },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  headerTextContainer: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.xs / 2 },
  headerSubtitle: { ...typography.body, color: colors.textSecondary, fontSize: 14 },
  searchButton: { padding: spacing.xs },
  searchContainer: { marginTop: spacing.sm },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  scrollContent: { padding: spacing.md },
  searchResultsContainer: { marginTop: spacing.sm },
  searchLoadingContainer: { alignItems: 'center', padding: spacing.xl },
  searchLoadingText: { marginTop: spacing.sm, color: colors.textSecondary },
  searchResultsTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  searchResultsList: { gap: spacing.md },
  searchResultItem: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, ...shadows.small, marginBottom: spacing.sm },
  searchResultThumbnail: { width: 120, height: 68, borderRadius: borderRadius.sm, marginRight: spacing.md },
  searchResultContent: { flex: 1, justifyContent: 'center' },
  searchResultTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: spacing.xs / 2 },
  searchResultSubtitle: { ...typography.caption, color: colors.textSecondary },
  emptySearchContainer: { padding: spacing.xl, alignItems: 'center' },
  emptySearchText: { ...typography.body, color: colors.textSecondary },
  categorySection: { marginBottom: spacing.xl },
  categoryTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs / 2 },
  categoryCount: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  horizontalScroll: { marginHorizontal: -spacing.md },
  lectureCard: { width: 200, marginRight: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.small },
  lectureThumbnail: { width: '100%', height: 112, backgroundColor: colors.background },
  placeholderThumbnail: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  lectureCardTitle: { ...typography.body, color: colors.text, fontWeight: '600', padding: spacing.sm, paddingBottom: spacing.xs / 2 },
  lectureCardSubtitle: { ...typography.caption, color: colors.textSecondary, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
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
});
