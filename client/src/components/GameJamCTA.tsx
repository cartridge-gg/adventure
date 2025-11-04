import { GAME_JAM_TEXT } from '@/lib/uiText';

export function GameJamCTA() {
  return (
    <a
      href={GAME_JAM_TEXT.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-ronin-primary hover:bg-red-600 text-ronin-secondary font-semibold py-4 px-6 border-2 border-ronin-secondary/30 transition-all duration-300 flex items-center justify-center space-x-3"
    >
      <span>{GAME_JAM_TEXT.button}</span>
    </a>
  );
}
