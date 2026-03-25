# Quick PowerShell Commands for Build and Submit
# Copy and paste these commands into PowerShell

# Option 1: Build and Submit in One Command (Recommended)
# This builds first, then automatically submits when build completes
Write-Host "🚀 Building and submitting to App Store..." -ForegroundColor Cyan
cd project
eas build --platform ios --profile production --clear-cache --non-interactive; if ($?) { eas submit --platform ios --profile production --non-interactive }

# Option 2: Build Only (then submit manually later)
# eas build --platform ios --profile production --clear-cache

# Option 3: Submit Existing Build Only
# eas submit --platform ios --profile production
