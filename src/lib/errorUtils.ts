/**
 * Sanitized error handling utilities
 * Prevents leaking internal database/system information to users
 */

// Generic user-friendly error messages (Persian)
const ERROR_MESSAGES = {
  default: 'عملیات ناموفق بود. لطفاً دوباره تلاش کنید.',
  network: 'خطا در اتصال به سرور. اتصال اینترنت خود را بررسی کنید.',
  auth: 'خطا در احراز هویت. لطفاً دوباره وارد شوید.',
  permission: 'شما دسترسی لازم برای این عملیات را ندارید.',
  notFound: 'مورد درخواستی یافت نشد.',
  validation: 'اطلاعات وارد شده صحیح نیست.',
  save: 'خطا در ذخیره‌سازی اطلاعات.',
  load: 'خطا در بارگذاری اطلاعات.',
  delete: 'خطا در حذف اطلاعات.',
} as const;

type ErrorType = keyof typeof ERROR_MESSAGES;

/**
 * Get a user-friendly error message
 * Logs the full error in development for debugging
 */
export const getSafeErrorMessage = (
  error: unknown,
  errorType: ErrorType = 'default'
): string => {
  // In development, log the full error for debugging
  if (import.meta.env.DEV) {
    console.error('[Debug] Full error:', error);
  }
  
  return ERROR_MESSAGES[errorType];
};

/**
 * Check if error is related to RLS/permissions
 */
export const isPermissionError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
    
  return (
    errorMessage.includes('row-level security') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('policy') ||
    errorMessage.includes('unauthorized')
  );
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
    
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  );
};

/**
 * Get appropriate error message based on error type
 */
export const getContextualErrorMessage = (
  error: unknown,
  context: 'save' | 'load' | 'delete' | 'default' = 'default'
): string => {
  if (isPermissionError(error)) {
    return ERROR_MESSAGES.permission;
  }
  
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.network;
  }
  
  return ERROR_MESSAGES[context];
};

/**
 * Safe JSON parse with validation
 */
export const safeJsonParse = <T>(
  jsonString: string | null,
  validator?: (data: unknown) => data is T,
  fallback?: T
): T | null => {
  if (!jsonString) return fallback ?? null;
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (validator && !validator(parsed)) {
      if (import.meta.env.DEV) {
        console.warn('[Debug] JSON validation failed for:', parsed);
      }
      return fallback ?? null;
    }
    
    return parsed as T;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Debug] JSON parse error:', error);
    }
    return fallback ?? null;
  }
};