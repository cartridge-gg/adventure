import { useMemo, useEffect, useRef } from 'react';
import { useReadContract } from '@starknet-react/core';
import { RONIN_PACT_ADDRESS, RONIN_PACT_ABI } from '@/lib/config';
import { TrialProgress } from '@/lib/types';
import { Abi } from 'starknet';
import { ShareButton } from './ShareButton';
import { NFT_RENDER_TEXT } from '@/lib/uiText';

interface NFTRenderProps {
  progress: TrialProgress;
  tokenId: string;
}

const TRIALS = [
  { name: NFT_RENDER_TEXT.trials.waza, key: 'waza_complete' as const },
  { name: NFT_RENDER_TEXT.trials.chi, key: 'chi_complete' as const },
  { name: NFT_RENDER_TEXT.trials.shin, key: 'shin_complete' as const },
];

export function NFTRender({ progress, tokenId }: NFTRenderProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Fetch tokenURI from the contract
  const { data: tokenURIData, isLoading, refetch } = useReadContract({
    address: RONIN_PACT_ADDRESS as `0x${string}`,
    abi: RONIN_PACT_ABI as Abi,
    functionName: 'token_uri',
    args: [BigInt(tokenId)],
    watch: true, // Poll for updates when progress changes
    enabled: !!tokenId,
  });

  // Refetch token URI when progress changes
  useEffect(() => {
    if (tokenId && refetch) {
      refetch();
    }
  }, [progress.waza_complete, progress.chi_complete, progress.shin_complete, tokenId, refetch]);

  // Parse and extract SVG from tokenURI
  const svgContent = useMemo(() => {
    if (!tokenURIData) return null;

    try {
      const dataURI = tokenURIData as string;

      // Check if it's an SVG data URI directly
      if (dataURI.startsWith('data:image/svg+xml;utf8,')) {
        return dataURI.substring('data:image/svg+xml;utf8,'.length);
      }

      // Otherwise expect format: data:application/json;base64,<base64_encoded_json>
      if (dataURI.startsWith('data:application/json;base64,')) {
        const base64Data = dataURI.split(',')[1];
        const jsonStr = atob(base64Data);
        const metadata = JSON.parse(jsonStr);

        // Extract SVG from image field
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.split(',')[1];
          return atob(svgBase64);
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  }, [tokenURIData]);

  const allComplete = TRIALS.every(({ key }) => progress[key]);

  // Function to download SVG as PNG
  const downloadAsPNG = async () => {
    if (!svgContainerRef.current) return;

    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Create a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (increase for better quality)
    const scale = 2; // 2x for retina display quality
    canvas.width = 1200 * scale; // Twitter recommended width
    canvas.height = 630 * scale; // Twitter recommended height for large image cards

    // Scale context for high quality
    ctx.scale(scale, scale);

    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create image and draw to canvas
    const img = new Image();
    img.onload = () => {
      // Fill background with dark color (matching your theme)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 1200, 630);

      // Calculate dimensions to fit SVG centered
      const imgAspect = img.width / img.height;
      const canvasAspect = 1200 / 630;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = 1200;
        drawHeight = 1200 / imgAspect;
        offsetX = 0;
        offsetY = (630 - drawHeight) / 2;
      } else {
        // Image is taller than canvas
        drawHeight = 630;
        drawWidth = 630 * imgAspect;
        offsetX = (1200 - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'ronin-pact.png';
        link.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 border-4 border-ronin-primary/40 p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-96 h-96 bg-black border-4 border-ronin-secondary/20 flex items-center justify-center">
            <div className="text-ronin-secondary/50">{NFT_RENDER_TEXT.loading}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="bg-gray-900 border-4 border-ronin-primary/40 p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-96 h-96 bg-black border-4 border-ronin-secondary/20 flex items-center justify-center">
            <div className="text-ronin-secondary/50">{NFT_RENDER_TEXT.error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 shadow-2xl border-4 border-ronin-primary/40 relative">
      {/* Decorative corner brackets - outer */}
      <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-ronin-primary"></div>
      <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-ronin-primary"></div>
      <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-ronin-primary"></div>
      <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-ronin-primary"></div>

      {/* Dojo watermark in corner */}
      <div className="absolute top-4 right-4 w-8 h-8 opacity-10 pointer-events-none">
        <img src="/dojo-icon.svg" alt="" className="w-full h-full" />
      </div>

      <div className="flex flex-col items-center space-y-5">
        {/* NFT Visual */}
        <div className="relative w-full">
          <div
            ref={svgContainerRef}
            className="relative w-full aspect-square bg-black border-4 border-ronin-secondary/20"
          >
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          </div>

          {/* Inner decorative corner accents */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-ronin-primary/60"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-ronin-primary/60"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-ronin-primary/60"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-ronin-primary/60"></div>
        </div>

        {/* Progress Indicators */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-8 py-4">
            {TRIALS.map(({ name, key }) => (
              <div key={name} className="flex flex-col items-center space-y-2 group">
                <div className="relative">
                  <div
                    className={`w-4 h-4 transition-all duration-500 border-2 ${
                      progress[key]
                        ? 'bg-ronin-primary border-ronin-primary shadow-lg shadow-ronin-primary/50 scale-110'
                        : 'bg-ronin-secondary/20 border-ronin-secondary/40 group-hover:bg-ronin-secondary/30 group-hover:border-ronin-secondary/60'
                    }`}
                  />
                  {progress[key] && (
                    <div className="absolute inset-0 bg-ronin-primary animate-ping opacity-30 border-2 border-ronin-primary"></div>
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    progress[key] ? 'text-ronin-secondary' : 'text-ronin-secondary/40'
                  }`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Section */}
        {allComplete && (
          <div className="w-full space-y-6 pt-6 border-t-4 border-ronin-primary relative">
            {/* Celebration header with frame */}
            <div className="text-center space-y-3 relative border-4 border-ronin-primary/30 p-4 bg-ronin-primary/5">
              {/* Dojo icon as celebration element - positioned within the frame */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img src="/dojo-icon.svg" alt="" className="w-24 h-24" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-ronin-primary tracking-wide">
                {NFT_RENDER_TEXT.completion.title}
              </h3>
              <p className="text-base text-ronin-accent leading-relaxed">
                {NFT_RENDER_TEXT.completion.message}
              </p>
              <p className="text-sm text-ronin-secondary/70 italic">
                {NFT_RENDER_TEXT.completion.callToAction}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <ShareButton />
              <button
                onClick={downloadAsPNG}
                className="text-ronin-accent hover:text-ronin-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto group border-b-2 border-ronin-accent/30 hover:border-ronin-secondary pb-1"
              >
                <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download as PNG</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
