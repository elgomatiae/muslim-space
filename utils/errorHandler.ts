/**
 * Error Handler Utility
 * Sanitizes error messages to show user-friendly messages instead of technical error codes
 */

export function getErrorMessage(error: any): string {
  // If it's already a user-friendly string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If no error object, return generic message
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  // Handle error objects with message property
  if (error.message) {
    const message = error.message;

    // Database/API errors - show user-friendly messages
    if (message.includes('PGRST') || message.includes('Could not find the table')) {
      return 'This feature is not available right now. Please try again later.';
    }

    if (message.includes('Network request failed') || message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return 'The request took too long. Please try again.';
    }

    // Authentication errors
    if (message.includes('Invalid login credentials') || message.includes('Invalid email or password')) {
      return 'Username or password not found. Please check your credentials and try again.';
    }

    if (message.includes('Email not confirmed')) {
      return 'Please verify your email address before logging in. Check your inbox for the verification link.';
    }

    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }

    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }

    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You do not have permission to perform this action.';
    }

    // Generic fallback - remove technical details
    // Remove error codes, stack traces, and technical details
    let cleanMessage = message
      .replace(/PGRST\d+/g, '')
      .replace(/Error:\s*/gi, '')
      .replace(/at\s+.*/g, '')
      .replace(/\(.*\)/g, '')
      .trim();

    // If message is too technical or contains error codes, use generic message
    if (cleanMessage.length < 10 || /^[A-Z0-9_]+$/.test(cleanMessage)) {
      return 'Something went wrong. Please try again.';
    }

    return cleanMessage;
  }

  // Handle error code property
  if (error.code) {
    // Don't show error codes to users
    return 'Something went wrong. Please try again.';
  }

  // Fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Sanitize error for logging (keeps technical details for debugging)
 */
export function getErrorForLogging(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.code) {
    return `Error code: ${error.code}`;
  }

  return String(error);
}
