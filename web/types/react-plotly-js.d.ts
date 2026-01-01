declare module 'react-plotly.js' {
  import * as React from 'react';
  import type { Config, Data, Layout } from 'plotly.js';

  export type PlotParams = {
    data?: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    frames?: any[];
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    onPurge?: (figure: any, graphDiv: any) => void;
    onError?: (err: any) => void;
  };

  const Plot: React.ComponentType<PlotParams>;
  export default Plot;
}


