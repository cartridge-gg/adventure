import { useState } from 'react';

/**
 * Unified error handling hook for trial components.
 * Manages both local errors (from validation) and hook errors (from async operations).
 *
 * @param hookError - Error from the trial hook (e.g., useWazaClaim, useChiQuiz, useShinTrial)
 * @param isCompleted - Whether the trial has been completed
 * @returns Error state and handlers
 */
export function useTrialError(hookError: string | null, isCompleted: boolean) {
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || hookError;
  const showError = displayError && !isCompleted;

  return {
    localError,
    setLocalError,
    clearError: () => setLocalError(null),
    displayError: displayError || '',
    showError: !!showError,
  };
}
