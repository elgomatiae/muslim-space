
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IbadahGoals, IlmGoals, AmanahGoals, SectionScores } from './imanScoreCalculator';

/**
 * DECAY SYSTEM - INTEGRATED WITH NEW MOMENTUM SYSTEM
 * 
 * The decay logic is now built into imanScoreCalculator.ts
 * This file provides activity recording for integration with other systems
 */

// ============================================================================
// ACTIVITY RECORDING
// ============================================================================

export async function recordActivity(
  section: 'ibadah' | 'ilm' | 'amanah',
  component: string,
  progressAmount: number = 1
): Promise<void> {
  try {
    // Update last activity timestamp
    const activityLog = await loadActivityLog();
    activityLog[section][component] = new Date().toISOString();
    await saveActivityLog(activityLog);
    
    console.log(`✅ Activity recorded: ${section}.${component} (+${progressAmount})`);
  } catch (error) {
    console.log('❌ Error recording activity:', error);
  }
}

// ============================================================================
// ACTIVITY LOG TRACKING
// ============================================================================

interface ActivityLog {
  ibadah: Record<string, string>;
  ilm: Record<string, string>;
  amanah: Record<string, string>;
}

async function loadActivityLog(): Promise<ActivityLog> {
  try {
    const saved = await AsyncStorage.getItem('imanActivityLog');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.log('Error loading activity log:', error);
  }
  
  const now = new Date().toISOString();
  return {
    ibadah: {
      prayer: now,
      quran: now,
      dhikr: now,
      dua: now,
      fasting: now,
    },
    ilm: {
      lectures: now,
      recitations: now,
      quizzes: now,
      reflection: now,
    },
    amanah: {
      exercise: now,
      water: now,
      workout: now,
      mentalHealth: now,
      sleep: now,
      stress: now,
    },
  };
}

async function saveActivityLog(log: ActivityLog): Promise<void> {
  try {
    await AsyncStorage.setItem('imanActivityLog', JSON.stringify(log));
  } catch (error) {
    console.log('Error saving activity log:', error);
  }
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

/**
 * @deprecated The decay logic is now integrated into imanScoreCalculator.ts
 */
export async function updateScoresWithDecay(
  currentGoals: {
    ibadah: IbadahGoals;
    ilm: IlmGoals;
    amanah: AmanahGoals;
  },
  freshScores: SectionScores
): Promise<SectionScores> {
  // Decay is now handled automatically in getCurrentSectionScores()
  return freshScores;
}

/**
 * @deprecated The decay logic is now integrated into imanScoreCalculator.ts
 */
export async function applyDecayToScores(): Promise<SectionScores> {
  // Decay is now handled automatically in getCurrentSectionScores()
  return { ibadah: 0, ilm: 0, amanah: 0 };
}

/**
 * Reset momentum state (for testing or manual reset)
 */
export async function resetDecayState(): Promise<void> {
  try {
    const now = Date.now();
    const state = {
      lastActivityTimestamp: now,
      consecutiveDaysActive: 0,
      historicalAverage: 0,
      momentumMultiplier: 1.0,
      lastScores: { ibadah: 0, ilm: 0, amanah: 0 },
    };
    
    await AsyncStorage.setItem('imanMomentumState', JSON.stringify(state));
    console.log('✅ Momentum state reset');
  } catch (error) {
    console.log('❌ Error resetting momentum state:', error);
  }
}

/**
 * Get momentum diagnostics (for debugging)
 */
export async function getDecayDiagnostics(): Promise<{
  lastActivityTimestamp: number;
  hoursSinceActivity: number;
  consecutiveDaysActive: number;
  momentumMultiplier: number;
  historicalAverage: number;
}> {
  try {
    const saved = await AsyncStorage.getItem('imanMomentumState');
    if (saved) {
      const state = JSON.parse(saved);
      const now = Date.now();
      const hoursSinceActivity = (now - state.lastActivityTimestamp) / (1000 * 60 * 60);
      
      return {
        lastActivityTimestamp: state.lastActivityTimestamp,
        hoursSinceActivity,
        consecutiveDaysActive: state.consecutiveDaysActive,
        momentumMultiplier: state.momentumMultiplier,
        historicalAverage: state.historicalAverage,
      };
    }
  } catch (error) {
    console.log('Error getting momentum diagnostics:', error);
  }
  
  return {
    lastActivityTimestamp: Date.now(),
    hoursSinceActivity: 0,
    consecutiveDaysActive: 0,
    momentumMultiplier: 1.0,
    historicalAverage: 0,
  };
}
