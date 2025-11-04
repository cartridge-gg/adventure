import { useState, useCallback, useMemo, useEffect } from 'react';
import { useReadContract } from '@starknet-react/core';
import { Abi, byteArray } from 'starknet';

import { QUEST_MANAGER_ADDRESS, QUEST_MANAGER_ABI, RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { splitTokenIdToU256, parseContractError } from '@/lib/utils';
import { useTrialTransaction } from './useTrialTransaction';
import { ERROR_TEXT, SHIN_TEXT } from '@/lib/uiText';

interface UseShinTrialReturn {
  vowText: string;
  setVowText: (text: string) => void;
  completeVow: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number | null;
  canComplete: boolean;
  timeLockDuration: number | null;
}

export function useShinTrial(tokenId: string, onSuccess?: () => void): UseShinTrialReturn {
  const [vowText, setVowText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));

  // Fetch time lock from Quest Manager contract
  const {
    data: timeLockData,
  } = useReadContract({
    abi: QUEST_MANAGER_ABI as Abi,
    address: QUEST_MANAGER_ADDRESS as `0x${string}`,
    functionName: 'get_time_lock',
    args: [],
    enabled: !!QUEST_MANAGER_ADDRESS,
  });

  const timeLockDuration = useMemo(() => {
    if (!timeLockData) return null;
    return Number(timeLockData);
  }, [timeLockData]);

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch mint timestamp from NFT contract
  const { data: mintTimestampData } = useReadContract({
    abi: RONIN_PACT_ABI as Abi,
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    functionName: 'get_timestamp',
    args: [tokenId ? BigInt(tokenId) : 0n],
    enabled: !!tokenId && !!RONIN_PACT_ADDRESS,
  });

  // Calculate time remaining and whether trial can be completed
  const { timeRemaining, canComplete } = useMemo(() => {
    if (!mintTimestampData || !tokenId || !timeLockDuration) {
      return { timeRemaining: null, canComplete: false };
    }

    const mintTimestamp = Number(mintTimestampData);
    const timeElapsed = currentTime - mintTimestamp;

    const remaining = timeLockDuration - timeElapsed;

    return {
      timeRemaining: remaining > 0 ? remaining : 0,
      canComplete: timeElapsed >= timeLockDuration,
    };
  }, [mintTimestampData, tokenId, timeLockDuration, currentTime]);

  // Use the base transaction hook with custom error parsing
  const { execute, isLoading: txIsLoading, error: txError } = useTrialTransaction({
    entrypoint: 'complete_shin',
    label: 'Shin Trial Transaction',
    onSuccess,
    parseError: (err) => parseContractError(err, timeLockDuration ?? undefined),
  });

  const completeVow = useCallback(
    async (): Promise<void> => {
      if (!tokenId) {
        setError(ERROR_TEXT.tokenIdNotFound);
        return;
      }

      if (!vowText.trim()) {
        setError(SHIN_TEXT.errors.writeVow);
        return;
      }

      setError(null);

      // Call complete_shin on Quest Manager contract
      const { low, high } = splitTokenIdToU256(tokenId);
      const vowByteArray = byteArray.byteArrayFromString(vowText.trim())
      await execute([low, high, vowByteArray]);
    },
    [tokenId, vowText, execute]
  );

  return {
    vowText,
    setVowText,
    completeVow,
    isLoading: txIsLoading,
    error: error || txError,
    timeRemaining,
    canComplete,
    timeLockDuration,
  };
}
