# PowerShell Script: Build and Auto-Submit to App Store
# Run this script from the project root directory

Write-Host "🚀 Starting iOS Build and App Store Submission..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to project directory (if not already there)
if (Test-Path "app.json") {
    Write-Host "✅ Already in project directory" -ForegroundColor Green
} else {
    Write-Host "📁 Changing to project directory..." -ForegroundColor Yellow
    Set-Location "project"
    if (-not (Test-Path "app.json")) {
        Write-Host "❌ Error: app.json not found. Please run this script from the project root." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Check if EAS CLI is installed
Write-Host "🔍 Checking EAS CLI..." -ForegroundColor Yellow
$easCheck = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easCheck) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Check if logged in to EAS
Write-Host "🔍 Checking EAS login status..." -ForegroundColor Yellow
$loginCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to EAS. Please log in:" -ForegroundColor Yellow
    Write-Host "   eas login" -ForegroundColor Cyan
    Write-Host ""
    $login = Read-Host "Do you want to log in now? (y/n)"
    if ($login -eq "y" -or $login -eq "Y") {
        eas login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Cannot proceed without EAS login" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Logged in to EAS" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Step 1: Building iOS app for production..." -ForegroundColor Cyan
Write-Host "   This may take 15-30 minutes..." -ForegroundColor Yellow
Write-Host ""

# Step 4: Build for iOS production
eas build --platform ios --profile production --clear-cache --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Submit to App Store
Write-Host "📤 Step 2: Submitting to App Store..." -ForegroundColor Cyan
Write-Host "   This will automatically submit the latest build to App Store Connect..." -ForegroundColor Yellow
Write-Host ""

eas submit --platform ios --profile production --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Submission failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 You can manually submit later with:" -ForegroundColor Yellow
    Write-Host "   eas submit --platform ios --profile production" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully submitted to App Store!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Go to App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor White
Write-Host "   2. Navigate to your app → TestFlight" -ForegroundColor White
Write-Host "   3. Wait for processing (usually 5-15 minutes)" -ForegroundColor White
Write-Host "   4. Once processed, you can:" -ForegroundColor White
Write-Host "      - Test in TestFlight" -ForegroundColor White
Write-Host "      - Submit for App Store review" -ForegroundColor White
Write-Host ""
