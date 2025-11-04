import { useState } from 'react';

import { useAccount, useConnect } from '@starknet-react/core';
import { CallData } from 'starknet';
import { ControllerConnector } from '@cartridge/connector';

import { QUEST_MANAGER_ADDRESS } from '@/lib/config';
import { executeTx } from '@/lib/utils';
import { MINT_TEXT } from '@/lib/uiText';

export function MintButton() {
  const { address, account } = useAccount();
  const { connectors } = useConnect();
  const controller = connectors[0] as ControllerConnector;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMint = async () => {
    if (!account || !address) {
      setError(MINT_TEXT.error.pleaseConnect);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const username = (await controller.username()) || "ronin";

      await executeTx(
        account,
        [{
          contractAddress: QUEST_MANAGER_ADDRESS,
          entrypoint: 'mint',
          calldata: CallData.compile([username.slice(0, 31)]), // Truncate for felt252 compatibility
        }],
        'Mint Pact Transaction'
      );

      setSuccess(true);

      // Auto-redirect after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 2000); // 2 second delay to show success message
    } catch (err: any) {
      console.error('Mint failed:', err);
      setError(err?.message || 'Failed to mint NFT');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Main Container with decorative frame */}
      <div className="relative border-4 border-ronin-primary/40 bg-gray-900 shadow-2xl">
        {/* Outer corner decorations */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-ronin-primary"></div>
        <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-ronin-primary"></div>
        <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-ronin-primary"></div>
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-ronin-primary"></div>

        <div className="p-6 md:p-8">

          {/* Header Section */}
          <div className="text-center mb-6">
            {/* Decorative Japanese-inspired icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-3 bg-ronin-primary border-4 border-ronin-secondary/30 relative">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-ronin-secondary"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-ronin-secondary"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-ronin-secondary"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-ronin-secondary"></div>

              <svg
                className="w-8 h-8 text-ronin-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Sword icon */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>

            <h2 className="font-heading text-xl md:text-2xl font-bold text-ronin-secondary mb-2">
              {MINT_TEXT.header.title}
            </h2>
            <p className="text-ronin-accent text-sm md:text-base max-w-md mx-auto leading-relaxed">
              {MINT_TEXT.header.description}
            </p>
          </div>

          {/* Mint Button */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <button
              onClick={handleMint}
              disabled={isLoading || !address || success}
              className={`
                w-full md:w-auto
                px-8 py-3 font-bold text-base
                transition-all duration-300 ease-out
                border-2
                ${
                  success
                    ? 'bg-green-600 text-white cursor-default border-green-400'
                    : isLoading || !address
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-500'
                    : 'bg-ronin-primary hover:bg-red-600 text-white border-ronin-secondary/30 hover:border-ronin-secondary'
                }
                flex items-center justify-center gap-3
                relative
              `}
            >
              {isLoading ? (
                <>
                  {/* Spinning loader */}
                  <svg
                    className="animate-spin h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{MINT_TEXT.button.minting}</span>
                </>
              ) : success ? (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{MINT_TEXT.button.success}</span>
                </>
              ) : (
                <>
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>{MINT_TEXT.button.mint}</span>
                </>
              )}
            </button>

            {/* Helper text for non-connected state */}
            {!address && !success && (
              <p className="text-ronin-accent text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {MINT_TEXT.helpText.connectWallet}
              </p>
            )}

            {/* Redirect message for success state */}
            {success && (
              <p className="text-gray-400 text-sm italic animate-in fade-in duration-500">
                {MINT_TEXT.helpText.redirecting}
              </p>
            )}
          </div>

          {/* Status Messages */}
          <div className="min-h-[60px]">
            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-900/30 border-4 border-ronin-primary p-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ronin-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ronin-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ronin-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ronin-primary"></div>

                <div className="flex items-start gap-4 relative">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-ronin-primary flex items-center justify-center border-2 border-white/30">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-ronin-primary font-semibold mb-2">
                      {MINT_TEXT.error.title}
                    </p>
                    <p className="text-ronin-secondary text-sm mb-2">
                      {error}
                    </p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-ronin-accent hover:text-ronin-secondary text-sm underline transition-colors"
                    >
                      {MINT_TEXT.error.tryAgain}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="mt-4 pt-4 border-t border-ronin-accent/20">
            <p className="text-ronin-accent text-xs text-center mb-3">
              {MINT_TEXT.footer.info}
            </p>
            <div className="flex items-center justify-center gap-2 opacity-50">
              <span className="text-ronin-accent text-xs">Built with</span>
              <img src="/dojo-word.svg" alt="Dojo" className="h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
