import { ReactNode } from 'react';
import { LoadingSpinner } from './TrialStatus';
import { BUTTON_TEXT } from '@/lib/uiText';

interface SubmitButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  children: ReactNode;
  loadingText?: string;
  icon?: ReactNode;
}

// Default checkmark icon that matches the existing trial buttons
const DefaultCheckmarkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function SubmitButton({
  onClick,
  disabled = false,
  isLoading = false,
  children,
  loadingText = BUTTON_TEXT.defaultLoading,
  icon,
}: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full bg-ronin-primary hover:bg-ronin-primary/90 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-md px-6 py-3 text-ronin-secondary font-bold transition-colors flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          {loadingText}
        </>
      ) : (
        <>
          {icon !== undefined ? icon : <DefaultCheckmarkIcon />}
          {children}
        </>
      )}
    </button>
  );
}
