export interface PillProps {
  /** turn: gold "Your turn". wait: raised panel. done: line. out: hot-soft. chaos: violet (Route to Chaos round). streak: hot. */
  tone?: 'turn' | 'wait' | 'done' | 'out' | 'chaos' | 'streak';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Pill(props: PillProps): JSX.Element;
