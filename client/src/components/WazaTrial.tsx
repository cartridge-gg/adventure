import { useState } from 'react';

import { ALLOWLISTED_COLLECTIONS } from '@/lib/config';
import { useWazaClaim } from '@/hooks/useWazaClaim';
import { useTrialError } from '@/hooks/useTrialError';
import { BaseTrialProps, AllowlistedCollection } from '@/lib/types';
import { getTrialStatusFlags } from '@/lib/utils';
import { StatusMessage, LoadingSpinner } from './TrialStatus';
import { WAZA_TEXT } from '@/lib/uiText';

export function WazaTrial({ status, onComplete, tokenId }: BaseTrialProps) {
  const { tryCollection, isLoading, error } = useWazaClaim(tokenId, onComplete);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const { isDisabled, isCompleted } = getTrialStatusFlags(status);
  const { displayError, showError } = useTrialError(error, isCompleted);

  const handleClaimViaCollection = async (collection: AllowlistedCollection) => {
    setSelectedCollection(collection.name);
    await tryCollection(collection.address);
  };

  return (
    <div className="space-y-4">
      {isCompleted ? (
        <StatusMessage
          type="info"
          message={WAZA_TEXT.complete.title}
          detail={WAZA_TEXT.complete.message}
        />
      ) : (
        <>
          <div className="space-y-3 mb-4">
            <p className="text-ronin-secondary text-sm font-medium">
              {WAZA_TEXT.claimPrompt}
            </p>
            {ALLOWLISTED_COLLECTIONS.map((collection) => (
              <button
                key={collection.name}
                onClick={() => handleClaimViaCollection(collection)}
                disabled={isDisabled || (isLoading && selectedCollection === collection.name)}
                className="w-full bg-ronin-light/20 hover:bg-ronin-light/30 disabled:bg-gray-700/30 disabled:cursor-not-allowed border border-ronin-light/30 rounded-md px-4 py-3 text-ronin-secondary font-medium transition-colors text-left flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-ronin-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {collection.displayName}
                </span>
                {isLoading && selectedCollection === collection.name && (
                  <LoadingSpinner className="h-5 w-5 text-ronin-accent" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {showError && (
        <StatusMessage
          type="error"
          message={displayError}
          detail={WAZA_TEXT.error}
        />
      )}
    </div>
  );
}
