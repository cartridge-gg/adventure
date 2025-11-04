import { useAccount } from '@starknet-react/core';
import { ConnectWallet } from './components/ConnectWallet';
import { MintButton } from './components/MintButton';
import { QuestDashboard } from './components/QuestDashboard';
import { WazaTrial } from './components/WazaTrial';
import { ChiTrial } from './components/ChiTrial';
import { ShinTrial } from './components/ShinTrial';
import { GameJamCTA } from './components/GameJamCTA';
import { useTrialProgress } from './hooks/useTrialProgress';
import { APP_TEXT } from './lib/uiText';

function App() {
  const { address } = useAccount();
  const { progress, isLoading, hasNFT, tokenId, refetch } = useTrialProgress();

  return (
    <div className="min-h-screen bg-ronin-dark text-ronin-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-6 mb-12">
          <div className="flex-shrink-0 text-center lg:text-left">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ronin-primary mb-2 flex items-center justify-center gap-3">
              <img src="/dojo-dot.svg" alt="" className="w-6 h-6 flex-shrink-0" />
              {APP_TEXT.header.title}
              <img src="/dojo-dot.svg" alt="" className="w-6 h-6 flex-shrink-0" />
            </h1>
            <p className="text-ronin-accent text-base sm:text-lg text-center">
              {APP_TEXT.header.subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            {address && (
              <div className="w-64 flex-shrink-0">
                <GameJamCTA />
              </div>
            )}
            <div className="w-64 flex-shrink-0">
              <ConnectWallet />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {address ? (
            isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ronin-primary"></div>
                <p className="text-ronin-secondary mt-4">{APP_TEXT.loading.progress}</p>
              </div>
            ) : !hasNFT ? (
              <div className="py-8 md:py-12">
                <MintButton />
              </div>
            ) : progress && tokenId ? (
              <QuestDashboard
                progress={progress}
                tokenId={tokenId}
                onTrialComplete={refetch}
                wazaContent={(props) => <WazaTrial {...props} />}
                chiContent={(props) => <ChiTrial {...props} />}
                shinContent={(props) => <ShinTrial {...props} />}
              />
            ) : (
              <div className="text-center py-20">
                <h2 className="font-heading text-2xl text-ronin-secondary mb-4">
                  {APP_TEXT.errors.unableToLoad}
                </h2>
                <p className="text-ronin-accent">
                  {APP_TEXT.errors.checkConnection}
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <h2 className="font-heading text-2xl text-ronin-secondary mb-4">
                {APP_TEXT.noWallet.title}
              </h2>
              <p className="text-ronin-accent">
                {APP_TEXT.noWallet.subtitle}
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <a
              href="https://book.dojoengine.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="text-ronin-accent text-sm">Powered by</span>
              <img
                src="/dojo-word.svg"
                alt="Dojo"
                className="h-5 opacity-90"
              />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
