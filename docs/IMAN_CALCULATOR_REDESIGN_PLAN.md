# Iman Score Calculator - Complete Redesign Plan

## Problem Statement

The current calculator has critical issues:
1. **Fard prayers always counted**: Fard prayers are always included in Ibadah score, even when they shouldn't be the only enabled goal
2. **Goal enabling logic unclear**: No clear definition of what "enabled" means for fard prayers vs other goals
3. **Score inconsistencies**: When only fard prayers are enabled and all completed, score is not 100%
4. **Mixed goal handling**: Unclear how fard prayers interact with other enabled goals

## Current Architecture Issues

### Ibadah Score Calculation
- **Problem**: Fard prayers are ALWAYS added to progressions (line 141-152)
- **Problem**: No check if fard prayers are "enabled" (they're boolean, not goal values)
- **Problem**: If only fard prayers enabled, calculation might include other disabled goals

### Goal Enabling Logic
- **Other goals**: Enabled when `goal > 0` (e.g., `sunnahDailyGoal > 0`)
- **Fard prayers**: Enabled when at least one prayer is toggled on (boolean flags)
- **Inconsistency**: Different enabling mechanisms cause calculation errors

## New Architecture Design

### Core Principles

1. **Unified Goal Enabling**
   - A goal is "enabled" if it should be counted in the score
   - Fard prayers: Enabled if ANY fard prayer is toggled on
   - Other goals: Enabled if `goal > 0`

2. **Pure Completion Percentage**
   - For each enabled goal: `progress = min(1, completed / goal)`
   - Ring score = average of all enabled goal progressions × 100
   - If all enabled goals completed = 100% for that ring

3. **Equal Weighting**
   - All enabled goals within a ring have equal weight
   - No special treatment for fard prayers vs other goals

4. **Conditional Counting**
   - Only count goals that are enabled
   - If no goals enabled, return 0%
   - If only one goal enabled and completed, return 100%

### New Calculation Flow

#### Ibadah Score Calculation

```typescript
function calculateIbadahScore(goals: IbadahGoals): number {
  const enabledGoals: GoalProgress[] = [];
  
  // 1. Check if fard prayers are enabled
  const hasAnyFardPrayerEnabled = Object.values(goals.fardPrayers).some(p => p === true);
  if (hasAnyFardPrayerEnabled) {
    const completedFard = Object.values(goals.fardPrayers).filter(p => p === true).length;
    const totalFard = 5;
    enabledGoals.push({
      name: 'Fard Prayers',
      progress: completedFard / totalFard
    });
  }
  
  // 2. Check other goals (only if enabled)
  if (goals.sunnahDailyGoal > 0) {
    enabledGoals.push({
      name: 'Sunnah',
      progress: Math.min(1, goals.sunnahCompleted / goals.sunnahDailyGoal)
    });
  }
  
  // ... (similar for all other goals)
  
  // 3. Calculate average
  if (enabledGoals.length === 0) return 0;
  const totalProgress = enabledGoals.reduce((sum, g) => sum + g.progress, 0);
  return (totalProgress / enabledGoals.length) * 100;
}
```

#### Key Changes

1. **Fard Prayers Conditional**
   - Only count fard prayers if at least one is enabled
   - Check: `Object.values(goals.fardPrayers).some(p => p === true)`
   - If enabled: count completed out of 5 total

2. **Goal Enabling Check**
   - Before adding any goal to calculation, verify it's enabled
   - Fard: Check if any prayer is true
   - Others: Check if `goal > 0`

3. **Empty Goals Handling**
   - If no goals enabled: return 0%
   - If only one goal enabled and completed: return 100%

## Implementation Steps

### Phase 1: Analysis & Design
- [x] Document current issues
- [x] Design new architecture
- [ ] Define test cases

### Phase 2: Core Calculator Functions
- [ ] Rewrite `calculateIbadahScore()` with new logic
- [ ] Rewrite `calculateIlmScore()` (verify it's correct)
- [ ] Rewrite `calculateAmanahScore()` (verify it's correct)
- [ ] Update `calculateAllSectionScores()` to use new functions

### Phase 3: Integration
- [ ] Update `ImanTrackerContext` to use new calculator
- [ ] Update goal saving logic
- [ ] Update score refresh logic

### Phase 4: Testing
- [ ] Test: Only fard prayers enabled, all completed → 100%
- [ ] Test: Only fard prayers enabled, 3/5 completed → 60%
- [ ] Test: Fard + Sunnah enabled, both completed → 100%
- [ ] Test: Fard + Sunnah enabled, fard complete, sunnah 50% → 75%
- [ ] Test: No goals enabled → 0%
- [ ] Test: All goals enabled and completed → 100%

### Phase 5: Edge Cases
- [ ] Test: Goal enabled but goal value is 0 (shouldn't happen, but handle)
- [ ] Test: Completed exceeds goal (should cap at 100%)
- [ ] Test: Negative values (should handle gracefully)

## File Structure

```
utils/imanScoreCalculator.ts
├── Interfaces (IbadahGoals, IlmGoals, AmanahGoals)
├── calculateIbadahScore() - NEW LOGIC
├── calculateIlmScore() - VERIFY/CORRECT
├── calculateAmanahScore() - VERIFY/CORRECT
├── calculateAllSectionScores() - Use new functions
├── getOverallImanScore() - Weighted average
└── Helper functions (load, save, reset)
```

## Success Criteria

1. ✅ Only fard prayers enabled + all completed = 100%
2. ✅ Only fard prayers enabled + 3/5 completed = 60%
3. ✅ Fard + other goals enabled, all completed = 100%
4. ✅ Mixed completion = correct weighted average
5. ✅ No goals enabled = 0%
6. ✅ All goals enabled and completed = 100%

## Notes

- Fard prayers are special: they're boolean flags, not numeric goals
- Need to determine "enabled" state: if ANY fard prayer is true, fard prayers are enabled
- When fard prayers are enabled, count completed out of 5 total
- All other goals follow standard `goal > 0` enabling rule
