// Shared components for trial status messages

interface StatusMessageProps {
  message: string;
  detail?: string;
  type: 'success' | 'error' | 'info';
}

export function StatusMessage({ message, detail, type }: StatusMessageProps) {
  const styles = {
    success: {
      container: 'bg-green-900/20 border-green-500/30',
      text: 'text-green-400',
      detailText: 'text-green-400/70',
    },
    error: {
      container: 'bg-red-900/20 border-red-500/30',
      text: 'text-red-400',
      detailText: 'text-red-400/70',
    },
    info: {
      container: 'bg-ronin-primary/10 border-ronin-primary/30',
      text: 'text-ronin-primary',
      detailText: 'text-ronin-secondary/70',
    },
  };

  const style = styles[type];
  const Icon = type === 'success' ? CheckIcon : type === 'error' ? ErrorIcon : InfoIcon;

  return (
    <div className={`mt-4 border rounded-md p-4 ${style.container}`}>
      <p className={`text-sm font-semibold flex items-center gap-2 ${style.text}`}>
        <Icon />
        {message}
      </p>
      {detail && (
        <p className={`text-xs mt-1 ${style.detailText}`}>
          {detail}
        </p>
      )}
    </div>
  );
}

export function LoadingSpinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
