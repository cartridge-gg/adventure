import { useState } from 'react';

import { TRIALS, TrialName } from '@/lib/config';
import { TrialStatus, TrialProgress } from '@/lib/types';
import { TRIAL_CARD_TEXT } from '@/lib/uiText';

interface TrialCardProps {
  trialName: TrialName;
  status: TrialStatus;
  progress: TrialProgress;
  onComplete: () => void;
  tokenId: string;
  children: (props: { status: TrialStatus; onComplete: () => void; tokenId: string }) => React.ReactNode;
}

export function TrialCard({
  trialName,
  status,
  progress,
  onComplete,
  tokenId,
  children,
}: TrialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isComplete = progress[`${trialName}_complete`];
  const trial = TRIALS[trialName];
  const { name: title, subtitle, description } = trial;

  return (
    <div
      className={`relative bg-gray-900 shadow-lg border-4 transition-all duration-300 ${
        isComplete
          ? 'border-ronin-primary'
          : status === 'locked'
          ? 'border-ronin-secondary/20 opacity-60'
          : 'border-ronin-secondary/40 hover:border-ronin-accent'
      }`}
    >
      {/* Outer corner decorations */}
      {isComplete && (
        <>
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-ronin-primary"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-ronin-primary"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-ronin-primary"></div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-ronin-primary"></div>
        </>
      )}

      {/* Clickable Trial Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-left py-5 px-6 focus:outline-none transition-all hover:bg-ronin-light/5 ${
          isExpanded ? 'border-b-2 border-ronin-secondary/20' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="font-heading text-2xl font-bold text-ronin-secondary mb-1">
              {title}
            </h3>
            <p className="text-sm text-ronin-accent italic mb-2">{subtitle}</p>
            <p className="text-xs text-ronin-secondary/70">{description}</p>
          </div>

          {/* Chevron Icon */}
          <div className="flex-shrink-0 pt-1">
            <svg
              className={`w-6 h-6 text-ronin-accent transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Collapsible Trial Content */}
      {isExpanded && (
        <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {status === 'locked' && (
            <div className="flex items-center justify-center py-8 text-ronin-secondary/50">
              <p className="text-sm">{TRIAL_CARD_TEXT.locked}</p>
            </div>
          )}

          {status !== 'locked' && !isComplete && children({ status, onComplete, tokenId })}

          {isComplete && (
            <div className="bg-ronin-primary/10 border-4 border-ronin-primary/30 p-6 text-center relative">
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-ronin-primary"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-ronin-primary"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-ronin-primary"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-ronin-primary"></div>

              <div className="flex items-center justify-center space-x-2 text-ronin-primary">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold">{TRIAL_CARD_TEXT.complete.title}</span>
              </div>
              <p className="text-sm text-ronin-secondary/70 mt-2">
                {TRIAL_CARD_TEXT.complete.message} {title}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
