
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';

interface VideoFormData {
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  scholarName: string;
  reciterName: string;
  description: string;
  duration: string;
}

interface PlaylistImportData {
  playlistUrl: string;
}

export default function AdminPanelScreen() {
  const [activeTab, setActiveTab] = useState<'lectures' | 'recitations' | 'playlist' | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    videoUrl: '',
    thumbnailUrl: '',
    scholarName: '',
    reciterName: '',
    description: '',
    duration: '0',
  });
  const [playlistData, setPlaylistData] = useState<PlaylistImportData>({
    playlistUrl: '',
  });
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleTabSelect = (tab: 'lectures' | 'recitations' | 'playlist') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActiveTab(tab);
    setFormData({
      title: '',
      videoUrl: '',
      thumbnailUrl: '',
      scholarName: '',
      reciterName: '',
      description: '',
      duration: '0',
    });
    setPlaylistData({
      playlistUrl: '',
    });
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const fetchYouTubeMetadata = async (videoUrl: string) => {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      Alert.alert('Error', 'Invalid YouTube URL');
      return;
    }

    setFetchingMetadata(true);

    try {
      // Call Supabase Edge Function to fetch YouTube metadata
      const { data, error } = await supabase.functions.invoke('fetch-youtube-metadata', {
        body: { videoId },
      });

      if (error) {
        console.error('Error fetching YouTube metadata:', error);
        Alert.alert('Error', 'Failed to fetch video details. Using defaults.');
        // Set defaults
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: getYouTubeThumbnail(videoId),
        }));
        return;
      }

      if (data && data.success) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          thumbnailUrl: data.thumbnailUrl || getYouTubeThumbnail(videoId),
          duration: data.duration?.toString() || prev.duration,
          scholarName: data.channelTitle || prev.scholarName,
          reciterName: data.channelTitle || prev.reciterName,
        }));

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Success', 'Video details fetched successfully!');
      } else {
        Alert.alert('Info', 'Could not fetch all video details. Please fill in manually.');
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: getYouTubeThumbnail(videoId),
        }));
      }
    } catch (error: any) {
      console.error('Error fetching YouTube metadata:', error);
      Alert.alert('Error', 'Failed to fetch video details. Please fill in manually.');
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: getYouTubeThumbnail(videoId),
      }));
    } finally {
      setFetchingMetadata(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return false;
    }

    if (!formData.videoUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter a YouTube URL');
      return false;
    }

    const videoId = extractYouTubeVideoId(formData.videoUrl);
    if (!videoId) {
      Alert.alert('Validation Error', 'Please enter a valid YouTube URL');
      return false;
    }

    if (activeTab === 'lectures' && !formData.scholarName.trim()) {
      Alert.alert('Validation Error', 'Please enter a scholar name for lectures');
      return false;
    }

    if (activeTab === 'recitations' && !formData.reciterName.trim()) {
      Alert.alert('Validation Error', 'Please enter a reciter name for recitations');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const videoId = extractYouTubeVideoId(formData.videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get or create default category
      const categoryType = activeTab === 'lectures' ? 'lecture' : 'recitation';
      const { data: categories, error: categoryError } = await supabase
        .from('video_categories')
        .select('id')
        .eq('type', categoryType)
        .limit(1);

      if (categoryError) {
        throw categoryError;
      }

      let categoryId: string;
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        // Create a default category if none exists
        const { data: newCategory, error: createCategoryError } = await supabase
          .from('video_categories')
          .insert({
            name: activeTab === 'lectures' ? 'General Lectures' : 'General Recitations',
            description: `Default category for ${activeTab}`,
            type: categoryType,
            order_index: 0,
          })
          .select('id')
          .single();

        if (createCategoryError) {
          throw createCategoryError;
        }

        categoryId = newCategory.id;
      }

      // Prepare thumbnail URL
      const thumbnailUrl = formData.thumbnailUrl.trim() || getYouTubeThumbnail(videoId);

      // Insert video
      const videoData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: thumbnailUrl,
        category_id: categoryId,
        duration: parseInt(formData.duration) || 0,
        views: 0,
        order_index: 0,
      };

      if (activeTab === 'lectures') {
        videoData.scholar_name = formData.scholarName.trim();
      } else {
        videoData.reciter_name = formData.reciterName.trim();
      }

      const { error: insertError } = await supabase
        .from('videos')
        .insert(videoData);

      if (insertError) {
        throw insertError;
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Success',
        `${activeTab === 'lectures' ? 'Lecture' : 'Recitation'} added successfully!`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                title: '',
                videoUrl: '',
                thumbnailUrl: '',
                scholarName: '',
                reciterName: '',
                description: '',
                duration: '0',
              });
            },
          },
          {
            text: 'Done',
            onPress: () => {
              setActiveTab(null);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding video:', error);
      Alert.alert('Error', error.message || 'Failed to add video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistImport = async () => {
    if (!playlistData.playlistUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter a YouTube playlist URL');
      return;
    }

    setLoading(true);

    try {
      // Get the first category for the selected type
      const categoryType = activeTab === 'playlist' ? 'lecture' : 'lecture';
      const { data: categories, error: categoryError } = await supabase
        .from('video_categories')
        .select('id')
        .eq('type', categoryType)
        .limit(1);

      if (categoryError) {
        throw categoryError;
      }

      let categoryId: string;
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        // Create a default category if none exists
        const { data: newCategory, error: createCategoryError } = await supabase
          .from('video_categories')
          .insert({
            name: 'Imported Lectures',
            description: 'Videos imported from YouTube playlists',
            type: categoryType,
            order_index: 0,
          })
          .select('id')
          .single();

        if (createCategoryError) {
          throw createCategoryError;
        }

        categoryId = newCategory.id;
      }

      // Call Supabase Edge Function to import playlist
      const { data, error } = await supabase.functions.invoke('youtube-playlist-import', {
        body: {
          playlistUrl: playlistData.playlistUrl,
          categoryId: categoryId,
        },
      });

      if (error) {
        console.error('Error importing playlist:', error);
        throw new Error(error.message || 'Failed to import playlist');
      }

      if (data && data.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Alert.alert(
          'Success',
          `Playlist imported successfully!\n\nTotal videos: ${data.totalVideos}\nSuccessfully added: ${data.successCount}\nErrors: ${data.errorCount}`,
          [
            {
              text: 'Import Another',
              onPress: () => {
                setPlaylistData({ playlistUrl: '' });
              },
            },
            {
              text: 'Done',
              onPress: () => {
                setActiveTab(null);
              },
            },
          ]
        );
      } else {
        throw new Error(data?.error || 'Failed to import playlist');
      }
    } catch (error: any) {
      console.error('Error importing playlist:', error);
      Alert.alert('Error', error.message || 'Failed to import playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(null);
    setFormData({
      title: '',
      videoUrl: '',
      thumbnailUrl: '',
      scholarName: '',
      reciterName: '',
      description: '',
      duration: '0',
    });
    setPlaylistData({
      playlistUrl: '',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.card}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Manage content</Text>
          </View>
          <View style={styles.headerIcon}>
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="admin-panel-settings"
              size={32}
              color={colors.card}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!activeTab ? (
          <React.Fragment>
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Welcome, Admin</Text>
              <Text style={styles.welcomeText}>
                Select an option below to add content to your app
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleTabSelect('lectures')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="video.fill"
                      android_material_icon_name="video-library"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>Add Lecture</Text>
                  <Text style={styles.optionDescription}>
                    Add YouTube links to the lectures section with auto-fetch
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleTabSelect('recitations')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="music.note"
                      android_material_icon_name="headset"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>Add Recitation</Text>
                  <Text style={styles.optionDescription}>
                    Add YouTube links to the Quran recitations section
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleTabSelect('playlist')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="list.bullet.rectangle"
                      android_material_icon_name="playlist-add"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>Import Playlist</Text>
                  <Text style={styles.optionDescription}>
                    Import entire YouTube playlists at once
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => router.push('/(tabs)/(learning)/recategorize-lectures')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="sparkles"
                      android_material_icon_name="auto-awesome"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>AI Recategorize Lectures</Text>
                  <Text style={styles.optionDescription}>
                    Use AI to automatically categorize all lectures
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => router.push('/(tabs)/(learning)/migrate-recitations')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="arrow.triangle.2.circlepath"
                      android_material_icon_name="sync"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>Migrate Recitations</Text>
                  <Text style={styles.optionDescription}>
                    Migrate Quran recitations from quran_recitations table with AI categorization
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={async () => {
                  Alert.alert(
                    'Recategorize Recitations',
                    'This will reorganize all Quran recitations into better categories. This may take a few moments. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Continue',
                        onPress: async () => {
                          setLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke('recategorize-recitations');
                            
                            if (error) {
                              throw error;
                            }

                            if (data && data.success) {
                              Alert.alert(
                                'Success!',
                                `Recategorization completed!\n\nTotal videos: ${data.totalVideos}\nRecategorized: ${data.recategorized}\n\nCategory distribution:\n${Object.entries(data.categoryStats || {})
                                  .sort((a: any, b: any) => b[1] - a[1])
                                  .map(([name, count]) => `• ${name}: ${count}`)
                                  .join('\n')}`
                              );
                            } else {
                              throw new Error(data?.error || 'Failed to recategorize');
                            }
                          } catch (error: any) {
                            console.error('Error recategorizing:', error);
                            Alert.alert('Error', error.message || 'Failed to recategorize recitations');
                          } finally {
                            setLoading(false);
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      ios_icon_name="folder.badge.gearshape"
                      android_material_icon_name="category"
                      size={48}
                      color={colors.card}
                    />
                  </View>
                  <Text style={styles.optionTitle}>Recategorize Recitations</Text>
                  <Text style={styles.optionDescription}>
                    Reorganize recitations into better categories with more balanced distribution
                  </Text>
                  <View style={styles.optionArrow}>
                    <IconSymbol
                      ios_icon_name="arrow.right.circle.fill"
                      android_material_icon_name="arrow-circle-right"
                      size={32}
                      color={colors.card}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </React.Fragment>
        ) : activeTab === 'playlist' ? (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <IconSymbol
                ios_icon_name="list.bullet.rectangle"
                android_material_icon_name="playlist-add"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.formTitle}>Import YouTube Playlist</Text>
            </View>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color={colors.info}
              />
              <Text style={styles.infoText}>
                Paste a YouTube playlist URL to import all videos at once. Video details will be automatically fetched.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YouTube Playlist URL *</Text>
              <TextInput
                style={styles.input}
                value={playlistData.playlistUrl}
                onChangeText={(text) => setPlaylistData({ playlistUrl: text })}
                placeholder="https://www.youtube.com/playlist?list=..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.inputHint}>
                All videos from the playlist will be imported as lectures
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handlePlaylistImport}
                activeOpacity={0.7}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="arrow.down.circle.fill"
                      android_material_icon_name="download"
                      size={20}
                      color={colors.card}
                    />
                    <Text style={styles.submitButtonText}>Import Playlist</Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <IconSymbol
                ios_icon_name={activeTab === 'lectures' ? 'video.fill' : 'music.note'}
                android_material_icon_name={activeTab === 'lectures' ? 'video-library' : 'headset'}
                size={32}
                color={colors.primary}
              />
              <Text style={styles.formTitle}>
                Add {activeTab === 'lectures' ? 'Lecture' : 'Recitation'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YouTube URL *</Text>
              <View style={styles.urlInputContainer}>
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  value={formData.videoUrl}
                  onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={[styles.fetchButton, fetchingMetadata && styles.fetchButtonDisabled]}
                  onPress={() => fetchYouTubeMetadata(formData.videoUrl)}
                  activeOpacity={0.7}
                  disabled={fetchingMetadata || !formData.videoUrl.trim()}
                >
                  {fetchingMetadata ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <React.Fragment>
                      <IconSymbol
                        ios_icon_name="arrow.down.circle.fill"
                        android_material_icon_name="download"
                        size={18}
                        color={colors.card}
                      />
                      <Text style={styles.fetchButtonText}>Fetch</Text>
                    </React.Fragment>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>
                Paste the YouTube URL and tap &quot;Fetch&quot; to auto-fill details
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter video title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {activeTab === 'lectures' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Scholar Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.scholarName}
                  onChangeText={(text) => setFormData({ ...formData, scholarName: text })}
                  placeholder="Enter scholar name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            {activeTab === 'recitations' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reciter Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reciterName}
                  onChangeText={(text) => setFormData({ ...formData, reciterName: text })}
                  placeholder="Enter reciter name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text.replace(/[^0-9]/g, '') })}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.7}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color={colors.card}
                    />
                    <Text style={styles.submitButtonText}>Add Video</Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  header: {
    paddingTop: Platform.OS === 'android' ? 56 : 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    ...shadows.colored,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  welcomeText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  optionCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  optionGradient: {
    padding: spacing.xxl,
    minHeight: 200,
  },
  optionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  optionTitle: {
    ...typography.h2,
    color: colors.card,
    marginBottom: spacing.sm,
  },
  optionDescription: {
    ...typography.body,
    color: colors.card,
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  optionArrow: {
    alignSelf: 'flex-end',
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: {
    ...typography.h3,
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  infoText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  urlInput: {
    flex: 1,
  },
  fetchButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 80,
  },
  fetchButtonDisabled: {
    opacity: 0.6,
  },
  fetchButtonText: {
    ...typography.captionBold,
    color: colors.card,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.card,
  },
  bottomPadding: {
    height: 40,
  },
});
