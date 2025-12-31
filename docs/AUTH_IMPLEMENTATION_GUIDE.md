
# Authentication Implementation Guide

## Overview

This guide explains the authentication system implemented in the Muslim Lifestyle app. The system ensures that users must log in or sign up before accessing the app's main features.

## Architecture

### 1. **AuthContext** (`contexts/AuthContext.tsx`)
The AuthContext manages the global authentication state throughout the app:

- **Session Management**: Tracks the current user session
- **User State**: Maintains the current user object
- **Loading State**: Indicates when authentication is being checked
- **Sign Out**: Provides a method to log out users

Key Features:
- Automatically checks for existing sessions on app startup
- Listens for authentication state changes (login, logout, etc.)
- Initializes user profiles in the database upon login/signup
- Provides authentication state to all components via React Context

### 2. **Root Layout** (`app/_layout.tsx`)
The root layout implements conditional navigation based on authentication state:

**Flow:**
1. App starts → AuthContext checks for existing session
2. If no session exists → Redirect to login screen
3. If session exists → Redirect to home screen
4. On login → Automatically navigate to home
5. On logout → Automatically navigate to login

**Key Implementation:**
```typescript
useEffect(() => {
  if (loading) return;

  const inAuthGroup = segments[0] === '(auth)';

  if (!session && !inAuthGroup) {
    // Not logged in → Go to login
    router.replace('/(auth)/login');
  } else if (session && inAuthGroup) {
    // Logged in but on auth screen → Go to home
    router.replace('/(tabs)/(home)/');
  }
}, [session, segments, loading]);
```

### 3. **Login Screen** (`app/(auth)/login.tsx`)
Beautiful, user-friendly login interface with:

**Features:**
- Email and password input fields
- Password visibility toggle
- Forgot password functionality
- Loading states with activity indicators
- Haptic feedback on interactions
- Automatic navigation after successful login
- User-friendly error messages

**Error Handling:**
- Email not confirmed → Prompts user to verify email
- Invalid credentials → Clear error message
- Network errors → Graceful error handling

### 4. **Signup Screen** (`app/(auth)/signup.tsx`)
Comprehensive registration interface with:

**Features:**
- Username, email, and password fields
- Password confirmation
- Password visibility toggles
- Password strength validation (minimum 6 characters)
- Email verification flow
- Loading states
- Haptic feedback

**Email Verification:**
- Uses Supabase's built-in email verification
- Sends verification email to user
- Redirects to `https://natively.dev/email-confirmed`
- Shows alert reminding users to verify email
- Prevents login until email is verified

## User Flow

### First Time User
1. Opens app → Sees login screen
2. Taps "Sign Up" → Goes to signup screen
3. Fills in username, email, password
4. Taps "Create Account"
5. Receives verification email
6. Clicks verification link in email
7. Returns to app → Logs in
8. Automatically navigated to home screen

### Returning User
1. Opens app → AuthContext checks for session
2. If session exists → Automatically goes to home
3. If no session → Shows login screen
4. Enters credentials → Logs in
5. Automatically navigated to home screen

### Logout Flow
1. User taps logout in profile
2. AuthContext.signOut() called
3. Session cleared
4. Automatically redirected to login screen

## Security Features

### 1. **Email Verification**
- All new users must verify their email
- Prevents fake accounts
- Uses Supabase's secure verification system

### 2. **Password Requirements**
- Minimum 6 characters
- Validated on client side
- Securely hashed by Supabase

### 3. **Session Management**
- Secure session tokens
- Automatic session refresh
- Secure storage of credentials

### 4. **Row Level Security (RLS)**
- All database tables use RLS policies
- Users can only access their own data
- Enforced at the database level

## Configuration

### Supabase Setup
The app uses Supabase for authentication. Configuration is in:
- `app/integrations/supabase/client.ts` - Supabase client initialization
- `lib/supabase.ts` - Re-exports and utility functions

### Email Redirect URL
All authentication emails redirect to:
```
https://natively.dev/email-confirmed
```

This is configured in:
- Login screen (password reset)
- Signup screen (email verification)

## Testing the Authentication Flow

### Test Signup
1. Open app
2. Tap "Sign Up"
3. Enter test credentials:
   - Username: testuser
   - Email: test@example.com
   - Password: test123
4. Check email for verification link
5. Click verification link
6. Return to app and login

### Test Login
1. Open app (should show login screen)
2. Enter verified credentials
3. Should automatically navigate to home
4. Close and reopen app
5. Should automatically be logged in

### Test Logout
1. Navigate to Profile tab
2. Tap logout button
3. Should return to login screen
4. Try accessing tabs → Should redirect to login

## Error Messages

The system provides user-friendly error messages:

- **"Email not confirmed"** → "Please verify your email address before logging in..."
- **"Invalid login credentials"** → "Invalid email or password. Please try again."
- **"Email already exists"** → "An account with this email already exists..."
- **Network errors** → "An unexpected error occurred. Please try again."

## Best Practices

### 1. **Never Store Passwords**
- Passwords are never stored locally
- Only session tokens are stored
- Supabase handles all password hashing

### 2. **Always Validate Input**
- Email format validation
- Password length validation
- Required field validation

### 3. **Provide Feedback**
- Loading indicators during async operations
- Success/error alerts
- Haptic feedback on interactions

### 4. **Handle Edge Cases**
- Network failures
- Invalid credentials
- Unverified emails
- Expired sessions

## Troubleshooting

### User Can't Login
1. Check if email is verified
2. Verify credentials are correct
3. Check Supabase dashboard for user status
4. Check network connection

### User Not Redirected After Login
1. Check AuthContext is properly initialized
2. Verify router.replace() is being called
3. Check console logs for errors
4. Ensure session is being set correctly

### Email Verification Not Working
1. Check Supabase email settings
2. Verify redirect URL is correct
3. Check spam folder
4. Verify email service is configured in Supabase

## Future Enhancements

Potential improvements to consider:

1. **Social Authentication**
   - Google Sign-In
   - Apple Sign-In
   - Facebook Login

2. **Biometric Authentication**
   - Face ID
   - Touch ID
   - Fingerprint

3. **Two-Factor Authentication**
   - SMS verification
   - Authenticator app support

4. **Password Strength Indicator**
   - Visual feedback on password strength
   - Requirements checklist

5. **Remember Me**
   - Optional persistent login
   - Configurable session duration

## Conclusion

The authentication system is now fully implemented and provides:
- ✅ Secure login/signup flow
- ✅ Email verification
- ✅ Session persistence
- ✅ Automatic navigation
- ✅ Beautiful UI
- ✅ Error handling
- ✅ User-friendly messages

Users will now see the login screen when they first open the app and must authenticate before accessing any features.
