
# Fixes for refreshData and Iman Tracker Percentage

## Issue 1: refreshData is not defined
**Problem:** Code is calling `refreshData()` but the function doesn't exist in ImanTrackerContext.

**Solution:** Replace all instances of `refreshData` with `refreshImanScore` from the ImanTrackerContext.

### Files to update:
- Any wellness screens calling `refreshData()`
- Replace with: `const { refreshImanScore } = useImanTracker();`
- Then call: `refreshImanScore()`

## Issue 2: Iman Tracker percentage not showing
**Problem:** The percentage value in the Iman rings isn't displaying.

**Solution:** Ensure the score calculation returns a valid number and the Text component displays it correctly.

### Check these areas:
1. Verify `overallScore` is a number (0-100)
2. Ensure the Text component rendering the percentage has proper styling
3. Add fallback: `{overallScore?.toFixed(0) || '0'}%`
4. Check if the text color contrasts with the background

### Example fix for Iman Tracker display:
```tsx
<Text style={styles.percentageText}>
  {overallScore ? Math.round(overallScore) : 0}%
</Text>
```

Make sure `percentageText` style has:
- Visible color (white or contrasting color)
- Appropriate fontSize
- fontWeight: 'bold'
