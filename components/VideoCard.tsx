
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { Video, getYouTubeThumbnailUrl, isYouTubeUrl } from '@/lib/supabase';

interface VideoCardProps {
  video: Video;
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export default function VideoCard({ video, onPress }: VideoCardProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Get the appropriate thumbnail URL
  const thumbnailUrl = isYouTubeUrl(video.video_url) 
    ? getYouTubeThumbnailUrl(video.video_url)
    : video.thumbnail_url;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
        </View>
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <IconSymbol
              ios_icon_name="play.fill"
              android_material_icon_name="play-arrow"
              size={24}
              color={colors.card}
            />
          </View>
        </View>
        {isYouTubeUrl(video.video_url) && (
          <View style={styles.youtubeBadge}>
            <Text style={styles.youtubeText}>YouTube</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        {(video.scholar_name || video.reciter_name) && (
          <Text style={styles.author} numberOfLines={1}>
            {video.scholar_name || video.reciter_name}
          </Text>
        )}
        <View style={styles.statsContainer}>
          <IconSymbol
            ios_icon_name="eye.fill"
            android_material_icon_name="visibility"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.views}>{formatViews(video.views)} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnailContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
    ...shadows.medium,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '600',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#FF0000',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  youtubeText: {
    ...typography.small,
    color: colors.card,
    fontWeight: '700',
    fontSize: 10,
  },
  infoContainer: {
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.captionBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  author: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  views: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});
