import React, { forwardRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { AudioBands, Theme } from '../../folia/folia-major-main/src/types';
import { resolveThemeFontStack, resolveThemeFontWeight } from '../../folia/folia-major-main/src/utils/fontStacks';

interface DioramaVisualizerShellProps {
  theme: Theme;
  audioPower: MotionValue<number>;
  audioBands: AudioBands;
  sharedProps?: {
    visualizerOpacity?: number;
  };
  visualizerOpacity?: number;
  children: React.ReactNode;
  className?: string;
}

// Spotify owns the background and player chrome. Keeping those layers outside this
// isolated React island prevents Folia's full background registry from pulling Pixi
// into the Three.js-only Diorama bundle.
const DioramaVisualizerShell = forwardRef<HTMLDivElement, DioramaVisualizerShellProps>(({
  theme,
  sharedProps,
  visualizerOpacity = 1,
  children,
  className = '',
}, ref) => (
  <div
    ref={ref}
    className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative ${className}`.trim()}
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: 'transparent',
      fontFamily: resolveThemeFontStack(theme),
      fontWeight: resolveThemeFontWeight(theme, 400),
      opacity: sharedProps?.visualizerOpacity ?? visualizerOpacity,
    }}
  >
    {children}
  </div>
));

DioramaVisualizerShell.displayName = 'DioramaVisualizerShell';

export default DioramaVisualizerShell;
