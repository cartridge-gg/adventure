import { TrialProgress, BaseTrialProps } from '@/lib/types';
import { NFTRender } from './NFTRender';
import { TrialCard } from './TrialCard';
import { DASHBOARD_TEXT } from '@/lib/uiText';

interface QuestDashboardProps {
  progress: TrialProgress;
  tokenId: string;
  onTrialComplete: () => void;
  wazaContent: (props: BaseTrialProps) => React.ReactNode;
  chiContent: (props: BaseTrialProps) => React.ReactNode;
  shinContent: (props: BaseTrialProps) => React.ReactNode;
}

export function QuestDashboard({
  progress,
  tokenId,
  onTrialComplete,
  wazaContent,
  chiContent,
  shinContent,
}: QuestDashboardProps) {
  return (
    <div className="min-h-screen bg-ronin-dark py-12 px-4 relative">
      {/* Subtle Dojo watermark background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-[0.02] pointer-events-none">
        <img src="/dojo-icon.svg" alt="" className="w-full h-full" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12 relative">
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Heading with traditional frame */}
          <div className="relative inline-block mx-auto">
            {/* Corner decorations */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-4 border-l-4 border-ronin-primary"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-4 border-r-4 border-ronin-primary"></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-4 border-l-4 border-ronin-primary"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-4 border-r-4 border-ronin-primary"></div>

            <div className="px-12 py-6 border-4 border-ronin-primary/30">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-ronin-secondary tracking-wide">
                The Three Trials
              </h1>
              <p className="text-lg md:text-xl text-ronin-accent/90 max-w-3xl mx-auto leading-relaxed mt-2">
                {DASHBOARD_TEXT.description}
              </p>
            </div>
          </div>

          {/* Decorative Line with Dojo icon */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="h-1 w-24 bg-ronin-primary"></div>
            <div className="p-2 border-2 border-ronin-primary">
              <img src="/dojo-icon.svg" alt="" className="w-6 h-6 opacity-50" />
            </div>
            <div className="h-1 w-24 bg-ronin-primary"></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Column: NFT Render - Takes up 2 of 5 columns */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <NFTRender progress={progress} tokenId={tokenId} />
            </div>
          </div>

          {/* Right Column: Trial Cards - Takes up 3 of 5 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trial 1: Waza */}
            <TrialCard
              trialName="waza"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {wazaContent}
            </TrialCard>

            {/* Trial 2: Chi */}
            <TrialCard
              trialName="chi"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {chiContent}
            </TrialCard>

            {/* Trial 3: Shin */}
            <TrialCard
              trialName="shin"
              status="available"
              progress={progress}
              onComplete={onTrialComplete}
              tokenId={tokenId}
            >
              {shinContent}
            </TrialCard>
          </div>
        </div>
      </div>
    </div>
  );
}
