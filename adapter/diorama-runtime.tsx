import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { motionValue, type MotionValue } from 'framer-motion';
import VisualizerDiorama from '../../folia/folia-major-main/src/components/visualizer/diorama/VisualizerDiorama';
import { DEFAULT_DIORAMA_TUNING } from '../../folia/folia-major-main/src/types';

type Frame = {
  time: number;
  currentLineIndex: number;
  power: number;
  bass: number;
  lowMid: number;
  mid: number;
  vocal: number;
  treble: number;
};

type Options = Record<string, any> & { host: HTMLElement; frame: Frame };

class DioramaRuntime {
  private root: Root;
  private options: Options;
  private values: Record<string, MotionValue<number>>;

  constructor(options: Options) {
    this.options = options;
    this.root = createRoot(options.host);
    this.values = Object.fromEntries(Object.entries(options.frame).filter(([key]) => key !== 'currentLineIndex').map(([key, value]) => [key, motionValue(value)]));
    this.render();
  }

  private render() {
    const { host: _host, frame, ...props } = this.options;
    this.root.render(<VisualizerDiorama {...props}
      currentTime={this.values.time}
      currentLineIndex={frame.currentLineIndex}
      audioPower={this.values.power}
      audioBands={{ bass: this.values.bass, lowMid: this.values.lowMid, mid: this.values.mid, vocal: this.values.vocal, treble: this.values.treble }}
      dioramaTuning={{ ...DEFAULT_DIORAMA_TUNING, ...(props.dioramaTuning || {}) }}
    />);
  }

  setFrame(frame: Frame) {
    this.options.frame = frame;
    for (const [key, value] of Object.entries(frame)) if (key !== 'currentLineIndex') this.values[key]?.set(value);
    this.render();
  }

  setOptions(patch: Record<string, any>) {
    Object.assign(this.options, patch);
    this.render();
  }

  destroy() {
    this.root.unmount();
    Object.values(this.values).forEach((value) => value.destroy?.());
  }
}

export const createDioramaRuntime = (options: Options) => new DioramaRuntime(options);
export { DEFAULT_DIORAMA_TUNING };
