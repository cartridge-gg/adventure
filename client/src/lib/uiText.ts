/**
 * UI Text Configuration for The Rōnin's Pact
 *
 * This file contains all user-facing text strings used throughout the application.
 * Edit this file to update copy without searching through multiple components.
 */

// ============================================================================
// MAIN APP HEADER & FOOTER
// ============================================================================

export const APP_TEXT = {
  header: {
    title: "The Rōnin's Pact",
    subtitle: "Forge your legend by mastering three trials",
  },
  footer: {
    poweredBy: "Powered by Cartridge Controller & Starknet",
  },
  loading: {
    progress: "Loading your progress...",
  },
  errors: {
    unableToLoad: "Unable to load quest data",
    checkConnection: "Please check your connection and try again",
  },
  noWallet: {
    title: "Connect your wallet to begin your journey",
    subtitle: "The trials await those brave enough to face them",
  },
} as const;

// ============================================================================
// QUEST DASHBOARD
// ============================================================================

export const DASHBOARD_TEXT = {
  description: "Each trial adds a blade to your Pact — a marker of your worth",
} as const;

// ============================================================================
// TRIAL CARDS (General)
// ============================================================================

export const TRIAL_CARD_TEXT = {
  locked: "Complete previous trials to unlock",
  complete: {
    title: "Trial Complete!",
    message: "You have mastered", // Followed by trial name
  },
} as const;

// ============================================================================
// TRIAL METADATA
// ============================================================================

export const TRIAL_METADATA = {
  waza: {
    name: 'Waza',
    subtitle: 'The Way of Technique',
    description: 'Prove your mastery by acquiring a token from a Dojo world.',
  },
  chi: {
    name: 'Chi',
    subtitle: 'The Way of Wisdom',
    description: 'Test your knowledge of Dojo architecture and principles.',
  },
  shin: {
    name: 'Shin',
    subtitle: 'The Way of Spirit',
    description: 'Pledge your vow and commit your spirit to the Dojo journey.',
  },
} as const;

// ============================================================================
// WAZA TRIAL (Technique)
// ============================================================================

export const WAZA_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your technique has been proven",
  },
  claimPrompt: "Verify ownership of one of these tokens:",
  error: "Ensure you own a token from one of the supported game collections",
} as const;

// ============================================================================
// CHI TRIAL (Wisdom)
// ============================================================================

export const CHI_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your wisdom has been demonstrated",
  },
  submit: "Submit Answers",
  submitting: "Submitting...",
  errors: {
    answerAll: "Please answer all questions before submitting",
    needCorrect: "You need at least 3 correct answers to pass",
  },
} as const;

// ============================================================================
// SHIN TRIAL (Spirit)
// ============================================================================

export const SHIN_TEXT = {
  complete: {
    title: "Trial Complete",
    message: "Your vow has been sealed on-chain",
  },
  timer: {
    remaining: "Time remaining:",
    waitMessage: "You must wait", // Followed by duration and "after minting before completing Shin"
    afterMinting: "after minting before completing Shin",
  },
  form: {
    label: "Write Your Vow",
    placeholder: "I pledge to bravely explore the new horizons of onchain gaming, fearlessly engage with strange mechanisms, and courageously experiment with fresh ideas...",
    info: "A hash of your vow will be recorded onchain as an eternal commitment",
  },
  buttons: {
    wait: "Wait", // Followed by duration
    seal: "Seal Your Vow",
    submitting: "Submitting...",
  },
  errors: {
    writeVow: "Please write your vow before completing the trial",
  },
} as const;

// ============================================================================
// WALLET CONNECTION
// ============================================================================

export const WALLET_TEXT = {
  connect: "Connect with Controller",
  dropdown: {
    profile: "Profile",
    settings: "Settings",
    disconnect: "Disconnect",
  },
} as const;

// ============================================================================
// MINT BUTTON / NFT MINTING
// ============================================================================

export const MINT_TEXT = {
  header: {
    title: "Forge Your Pact",
    description: "Mint your Rōnin's Pact NFT and begin your journey",
  },
  button: {
    mint: "Mint Your NFT",
    minting: "Forging Pact...",
    success: "Pact Forged!",
  },
  helpText: {
    connectWallet: "Connect your wallet to begin",
    redirecting: "Preparing your journey...",
  },
  error: {
    title: "Transaction Failed",
    tryAgain: "Try again",
    pleaseConnect: "Please connect your wallet first",
  },
  footer: {
    info: "This token marks your progress across the three sacred trials",
  },
} as const;

// ============================================================================
// GAME JAM CTA
// ============================================================================

export const GAME_JAM_TEXT = {
  button: "Join Dojo Game Jam VII",
  url: "https://luma.com/ug5owx3y",
} as const;

// ============================================================================
// SHARE BUTTON & MESSAGES (Used in NFT completion)
// ============================================================================

export const SHARE_TEXT = {
  button: "Share on X",
  message: "⚒️🔥 My Ronin's Pact is forged!\n\n" +
    "I have proven myself a true warrior.\n\n" +
    "Forge your own to compete for $15k in prizes at Dojo Game Jam VII: ronin.cartridge.gg\n\n" +
    "#Starknet #FOCG @ohayo_dojo",
} as const;

// ============================================================================
// NFT RENDER / COMPLETION
// ============================================================================

export const NFT_RENDER_TEXT = {
  loading: "Loading NFT...",
  error: "Failed to load NFT",
  completion: {
    title: "Congratulations, Ronin!",
    message: "Your legend is complete. ",
    callToAction: "Share your achievement with the world.",
  },
  trials: {
    waza: "Waza",
    chi: "Chi",
    shin: "Shin",
  },
} as const;

// ============================================================================
// GENERAL BUTTON TEXT
// ============================================================================

export const BUTTON_TEXT = {
  defaultLoading: "Submitting...",
} as const;

// ============================================================================
// GENERAL ERROR MESSAGES (used across multiple hooks/components)
// ============================================================================

export const ERROR_TEXT = {
  tokenIdNotFound: "Token ID not found",
  provideAnswers: "Please provide answers",
  walletNotConnected: "Please connect your wallet",
} as const;
