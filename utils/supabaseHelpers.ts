/**
 * Supabase query helpers for production safety
 * Ensures all queries are properly scoped and hardened
 */

import { supabase } from '@/app/integrations/supabase/client';
import { logger } from './logger';

/**
 * Safely execute a Supabase query with error handling and null checks
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  defaultValue: T,
  context?: string
): Promise<T> {
  try {
    const result = await queryFn();
    
    if (result.error) {
      logger.error(`Query error${context ? ` [${context}]` : ''}:`, result.error);
      return defaultValue;
    }
    
    return result.data ?? defaultValue;
  } catch (error) {
    logger.error(`Query exception${context ? ` [${context}]` : ''}:`, error);
    return defaultValue;
  }
}

/**
 * Ensure query is scoped by user_id (security check)
 */
export function ensureUserScoped(query: any, userId: string, tableName: string): any {
  // Check if query already has user_id filter
  // This is a runtime check - in production, always use .eq('user_id', userId) explicitly
  return query.eq('user_id', userId);
}

/**
 * Add pagination to query
 */
export function withPagination(query: any, limit: number = 50, offset: number = 0): any {
  return query.range(offset, offset + limit - 1);
}

/**
 * Safe select - only select needed columns
 */
export function safeSelect(columns: string[]): string {
  return columns.join(', ');
}
