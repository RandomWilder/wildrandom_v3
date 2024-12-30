// frontend/admin/src/utils/date.ts

/**
 * Date Utility Functions
 * 
 * Enterprise-grade date manipulation and formatting utilities for consistent
 * date handling across the application.
 */

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
};

/**
 * Format a date string or Date object into a standardized display format
 * 
 * @param date - Date string or Date object to format
 * @param options - Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string
 */
export const formatDate = (
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        // Validate date object
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date provided to formatDate:', date);
            return 'Invalid Date';
        }

        return new Intl.DateTimeFormat('en-US', options).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error';
    }
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * 
 * @param date - Date to compare against now
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    // Handle future dates
    if (diffInSeconds < 0) {
        return formatDate(date);
    }

    // Handle past dates
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }

    return 'Just now';
};

/**
 * Check if a date is within a specified range
 * 
 * @param date - Date to check
 * @param rangeStart - Start of range
 * @param rangeEnd - End of range
 * @returns boolean indicating if date is within range
 */
export const isDateInRange = (
    date: string | Date,
    rangeStart: string | Date,
    rangeEnd: string | Date
): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const startObj = typeof rangeStart === 'string' ? new Date(rangeStart) : rangeStart;
    const endObj = typeof rangeEnd === 'string' ? new Date(rangeEnd) : rangeEnd;

    return dateObj >= startObj && dateObj <= endObj;
};

/**
 * Format a duration from milliseconds into a human-readable string
 * 
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

/**
 * Parse a date string safely with timezone handling
 * 
 * @param dateString - Date string to parse
 * @returns Date object or null if invalid
 */
export const parseSafeDate = (dateString: string): Date | null => {
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
};