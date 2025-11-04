// Type definitions for The Rōnin's Pact

export interface TrialProgress {
  waza_complete: boolean;
  chi_complete: boolean;
  shin_complete: boolean;
}

export type TrialStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
}

export interface AllowlistedCollection {
  address: string;
  name: string;
  displayName: string;
}

export interface SignerInfo {
  guid: string;
  type: string; // "discord", "webauthn", "google", "metamask", etc.
  isRevoked: boolean;
}

export interface BaseTrialProps {
  status: TrialStatus;
  onComplete: () => void;
  tokenId: string;
}
