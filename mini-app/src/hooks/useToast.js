import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * Custom hook for managing toast notifications
 *
 * @returns {Object} Toast management functions
 */
export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    ({
      message,
      type = 'info',
      duration = 4000,
      action,
      onAction,
    }) => {
      const id = ++toastId;
      const newToast = {
        id,
        message,
        type,
        duration,
        action,
        onAction,
      };

      setToasts((prev) => [...prev, newToast]);

      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Helper functions for different toast types
  const success = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'success', ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'error', duration: 6000, ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'warning', ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'info', ...options });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Helper function to get user-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  // API error with structured response
  if (error.error?.message) {
    return error.error.message;
  }

  // Network error
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }

  // Timeout error
  if (error.name === 'AbortError') {
    return 'Request timeout. Please try again.';
  }

  // Generic error
  return error.message || 'Something went wrong';
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
