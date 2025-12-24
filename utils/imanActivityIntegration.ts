
import { logActivity, ActivityType, ActivityCategory } from './activityLogger';

/**
 * Helper functions to log Iman tracker activities
 */

export async function logPrayerCompleted(
  userId: string,
  prayerName: string
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'prayer_completed',
    activityCategory: 'ibadah',
    activityTitle: `${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} Prayer Completed`,
    activityDescription: `Completed ${prayerName} prayer on time`,
    pointsEarned: 10,
    metadata: { prayer_name: prayerName },
  });
}

export async function logSunnahPrayer(
  userId: string,
  count: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'sunnah_prayer',
    activityCategory: 'ibadah',
    activityTitle: 'Sunnah Prayer Completed',
    activityDescription: `Completed ${count} sunnah prayer${count > 1 ? 's' : ''}`,
    activityValue: count,
    activityUnit: 'prayers',
    pointsEarned: count * 5,
    metadata: { count },
  });
}

export async function logTahajjudPrayer(userId: string): Promise<void> {
  await logActivity({
    userId,
    activityType: 'tahajjud_prayer',
    activityCategory: 'ibadah',
    activityTitle: 'Tahajjud Prayer Completed',
    activityDescription: 'Prayed Tahajjud in the last third of the night',
    pointsEarned: 20,
  });
}

export async function logQuranReading(
  userId: string,
  pages?: number,
  verses?: number
): Promise<void> {
  const description = pages
    ? `Read ${pages} page${pages > 1 ? 's' : ''} of Quran`
    : verses
    ? `Read ${verses} verse${verses > 1 ? 's' : ''} of Quran`
    : 'Read Quran';

  await logActivity({
    userId,
    activityType: 'quran_reading',
    activityCategory: 'ibadah',
    activityTitle: 'Quran Reading',
    activityDescription: description,
    activityValue: pages || verses,
    activityUnit: pages ? 'pages' : 'verses',
    pointsEarned: (pages || verses || 1) * 5,
    metadata: { pages, verses },
  });
}

export async function logQuranMemorization(
  userId: string,
  verses: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'quran_memorization',
    activityCategory: 'ibadah',
    activityTitle: 'Quran Memorization',
    activityDescription: `Memorized ${verses} verse${verses > 1 ? 's' : ''} of Quran`,
    activityValue: verses,
    activityUnit: 'verses',
    pointsEarned: verses * 10,
    metadata: { verses },
  });
}

export async function logDhikrSession(
  userId: string,
  count: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'dhikr_session',
    activityCategory: 'ibadah',
    activityTitle: 'Dhikr Session',
    activityDescription: `Completed ${count} dhikr`,
    activityValue: count,
    activityUnit: 'dhikr',
    pointsEarned: Math.floor(count / 10),
    metadata: { count },
  });
}

export async function logDuaCompleted(
  userId: string,
  duaName?: string
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'dua_completed',
    activityCategory: 'ibadah',
    activityTitle: 'Dua Completed',
    activityDescription: duaName ? `Made dua: ${duaName}` : 'Made dua',
    pointsEarned: 5,
    metadata: { dua_name: duaName },
  });
}

export async function logFasting(userId: string, fastType: string): Promise<void> {
  await logActivity({
    userId,
    activityType: 'fasting',
    activityCategory: 'ibadah',
    activityTitle: 'Fasting Completed',
    activityDescription: `Completed ${fastType} fast`,
    pointsEarned: 15,
    metadata: { fast_type: fastType },
  });
}

export async function logLectureWatched(
  userId: string,
  lectureTitle: string,
  scholarName?: string
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'lecture_watched',
    activityCategory: 'ilm',
    activityTitle: 'Lecture Watched',
    activityDescription: scholarName
      ? `Watched "${lectureTitle}" by ${scholarName}`
      : `Watched "${lectureTitle}"`,
    pointsEarned: 10,
    metadata: { lecture_title: lectureTitle, scholar_name: scholarName },
  });
}

export async function logRecitationListened(
  userId: string,
  recitationTitle: string,
  reciterName?: string
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'recitation_listened',
    activityCategory: 'ilm',
    activityTitle: 'Recitation Listened',
    activityDescription: reciterName
      ? `Listened to "${recitationTitle}" by ${reciterName}`
      : `Listened to "${recitationTitle}"`,
    pointsEarned: 10,
    metadata: { recitation_title: recitationTitle, reciter_name: reciterName },
  });
}

export async function logQuizCompleted(
  userId: string,
  quizCategory: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'quiz_completed',
    activityCategory: 'ilm',
    activityTitle: 'Quiz Completed',
    activityDescription: `Scored ${score}/${totalQuestions} in ${quizCategory} quiz`,
    activityValue: score,
    activityUnit: 'points',
    pointsEarned: score * 2,
    metadata: { quiz_category: quizCategory, score, total_questions: totalQuestions },
  });
}

export async function logReflectionWritten(userId: string): Promise<void> {
  await logActivity({
    userId,
    activityType: 'reflection_written',
    activityCategory: 'ilm',
    activityTitle: 'Reflection Written',
    activityDescription: 'Wrote a Quran reflection',
    pointsEarned: 10,
  });
}

export async function logExerciseCompleted(
  userId: string,
  minutes: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'exercise_completed',
    activityCategory: 'amanah',
    activityTitle: 'Exercise Completed',
    activityDescription: `Exercised for ${minutes} minutes`,
    activityValue: minutes,
    activityUnit: 'minutes',
    pointsEarned: Math.floor(minutes / 5),
    metadata: { minutes },
  });
}

export async function logWaterLogged(
  userId: string,
  glasses: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'water_logged',
    activityCategory: 'amanah',
    activityTitle: 'Water Intake Logged',
    activityDescription: `Drank ${glasses} glass${glasses > 1 ? 'es' : ''} of water`,
    activityValue: glasses,
    activityUnit: 'glasses',
    pointsEarned: glasses,
    metadata: { glasses },
  });
}

export async function logWorkoutCompleted(
  userId: string,
  workoutType: string,
  duration: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'workout_completed',
    activityCategory: 'amanah',
    activityTitle: 'Workout Completed',
    activityDescription: `Completed ${workoutType} workout for ${duration} minutes`,
    activityValue: duration,
    activityUnit: 'minutes',
    pointsEarned: Math.floor(duration / 5),
    metadata: { workout_type: workoutType, duration },
  });
}

export async function logMeditationSession(
  userId: string,
  duration: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'meditation_session',
    activityCategory: 'amanah',
    activityTitle: 'Meditation Session',
    activityDescription: `Meditated for ${duration} minutes`,
    activityValue: duration,
    activityUnit: 'minutes',
    pointsEarned: Math.floor(duration / 5),
    metadata: { duration },
  });
}

export async function logSleepLogged(
  userId: string,
  hours: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'sleep_logged',
    activityCategory: 'amanah',
    activityTitle: 'Sleep Logged',
    activityDescription: `Slept for ${hours} hours`,
    activityValue: hours,
    activityUnit: 'hours',
    pointsEarned: Math.floor(hours),
    metadata: { hours },
  });
}

export async function logJournalEntry(userId: string): Promise<void> {
  await logActivity({
    userId,
    activityType: 'journal_entry',
    activityCategory: 'amanah',
    activityTitle: 'Journal Entry',
    activityDescription: 'Wrote a journal entry',
    pointsEarned: 5,
  });
}

export async function logAchievementUnlocked(
  userId: string,
  achievementTitle: string,
  points: number
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'achievement_unlocked',
    activityCategory: 'general',
    activityTitle: 'Achievement Unlocked!',
    activityDescription: `Unlocked "${achievementTitle}"`,
    pointsEarned: points,
    metadata: { achievement_title: achievementTitle },
  });
}

export async function logGoalCompleted(
  userId: string,
  goalType: string,
  goalCategory: ActivityCategory
): Promise<void> {
  await logActivity({
    userId,
    activityType: 'goal_completed',
    activityCategory: goalCategory,
    activityTitle: 'Goal Completed!',
    activityDescription: `Completed ${goalType} goal`,
    pointsEarned: 20,
    metadata: { goal_type: goalType },
  });
}
