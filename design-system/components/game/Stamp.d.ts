export interface StampProps {
  /** gold: hit / win. red: sunk / busted. blue: miss / splash. purple: peek / cheat. */
  tone?: 'gold' | 'red' | 'blue' | 'purple';
  /** The 2.4s slam-in-and-fade. Set false for a static render. */
  animate?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Stamp(props: StampProps): JSX.Element;
