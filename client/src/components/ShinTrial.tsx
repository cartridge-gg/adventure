import { useShinTrial } from '@/hooks/useShinTrial';
import { useTrialError } from '@/hooks/useTrialError';
import { BaseTrialProps } from '@/lib/types';
import { formatDuration, getTrialStatusFlags } from '@/lib/utils';
import { StatusMessage } from './TrialStatus';
import { SubmitButton } from './SubmitButton';
import { SHIN_TEXT } from '@/lib/uiText';

export function ShinTrial({ status, onComplete, tokenId }: BaseTrialProps) {
  const {
    vowText,
    setVowText,
    completeVow,
    isLoading,
    error,
    timeRemaining,
    canComplete,
    timeLockDuration,
  } = useShinTrial(tokenId, onComplete);

  const { isDisabled, isCompleted } = getTrialStatusFlags(status);
  const { setLocalError, displayError, showError } = useTrialError(error, isCompleted);

  const handleVowChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVowText(e.target.value);
    setLocalError(null);
  };

  const handleCompleteVow = async () => {
    if (!vowText.trim()) {
      setLocalError(SHIN_TEXT.errors.writeVow);
      return;
    }

    await completeVow();
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message={SHIN_TEXT.complete.title}
          detail={SHIN_TEXT.complete.message}
        />
      ) : (
        <>
          {/* Time Lock Info */}
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="bg-ronin-dark/30 border border-ronin-accent/30 rounded-md p-4">
              <div className="flex items-center gap-2 text-ronin-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {SHIN_TEXT.timer.remaining} {formatDuration(timeRemaining, { showSeconds: true })}
                </span>
              </div>
              <p className="text-ronin-accent/60 text-xs mt-1">
                {SHIN_TEXT.timer.waitMessage} {timeLockDuration ? formatDuration(timeLockDuration, { verbose: true }) : 'the required time'} {SHIN_TEXT.timer.afterMinting}
              </p>
            </div>
          )}

          {/* Vow Text Input */}
          <div className="mb-6">
            <label className="block text-ronin-secondary text-sm font-medium mb-2">
              {SHIN_TEXT.form.label}
            </label>
            <textarea
              value={vowText}
              onChange={handleVowChange}
              disabled={isDisabled}
              placeholder={SHIN_TEXT.form.placeholder}
              rows={4}
              className="w-full bg-ronin-dark/30 border border-ronin-light/20 rounded-md px-4 py-3 text-ronin-secondary placeholder-ronin-accent/40 focus:outline-none focus:ring-2 focus:ring-ronin-accent/50 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-ronin-accent/60 text-xs mt-1">
              {SHIN_TEXT.form.info}
            </p>
          </div>

          {/* Complete Vow Button */}
          <SubmitButton
            onClick={handleCompleteVow}
            disabled={!vowText.trim() || isDisabled || isLoading || !canComplete}
            isLoading={isLoading}
            loadingText={SHIN_TEXT.buttons.submitting}
          >
            {!canComplete
              ? `${SHIN_TEXT.buttons.wait} ${timeLockDuration ? formatDuration(timeLockDuration, { verbose: true }) : 'the required time'}`
              : SHIN_TEXT.buttons.seal}
          </SubmitButton>
        </>
      )}

      {showError && (
        <StatusMessage
          type="error"
          message={displayError}
        />
      )}
    </div>
  );
}
